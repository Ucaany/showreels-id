# Database Cleanup System - Architecture Diagrams

## 📐 System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph Supabase PostgreSQL
        A[pg_cron Extension] -->|Schedule| B[Cron Jobs]
        B -->|Daily 2AM| C[run_all_cleanups]
        B -->|Weekly Sun 4AM| D[cleanup_billing_transactions]
        
        C --> E[cleanup_visitor_events]
        C --> F[cleanup_visitor_daily_stats]
        C --> G[cleanup_admin_notifications]
        C --> H[cleanup_user_notifications]
        
        E --> I[visitor_events table]
        F --> J[visitor_daily_stats table]
        G --> K[admin_notifications table]
        H --> L[user_notifications table]
        D --> M[billing_transactions table]
        
        E --> N[cleanup_logs]
        F --> N
        G --> N
        H --> N
        D --> N
        
        N --> O[Monitoring & Alerts]
    end
    
    P[Developer/DBA] -->|Monitor| O
    P -->|Manual Trigger| C
    P -->|Manual Trigger| D
```

---

## 🔄 Cleanup Flow

### Daily Cleanup Flow

```mermaid
sequenceDiagram
    participant Cron as pg_cron
    participant Master as run_all_cleanups
    participant VE as cleanup_visitor_events
    participant VDS as cleanup_visitor_daily_stats
    participant AN as cleanup_admin_notifications
    participant UN as cleanup_user_notifications
    participant Log as cleanup_logs
    
    Cron->>Master: Trigger at 2:00 AM WIB
    Master->>VE: Execute cleanup
    VE->>VE: Delete events > 14 days
    VE->>Log: Insert log entry
    VE-->>Master: Return result
    
    Master->>VDS: Execute cleanup
    VDS->>VDS: Keep 100 rows per path
    VDS->>Log: Insert log entry
    VDS-->>Master: Return result
    
    Master->>AN: Execute cleanup
    AN->>AN: Delete read > 30 days
    AN->>Log: Insert log entry
    AN-->>Master: Return result
    
    Master->>UN: Execute cleanup
    UN->>UN: Delete read > 30 days
    UN->>Log: Insert log entry
    UN-->>Master: Return result
    
    Master-->>Cron: Return summary
```

---

## 🗄️ Database Schema

### Cleanup System Tables

```mermaid
erDiagram
    cleanup_logs {
        text id PK
        text table_name
        text cleanup_type
        integer rows_deleted
        integer execution_time_ms
        text status
        text error_message
        timestamp created_at
    }
    
    visitor_events {
        text id PK
        text visitor_id
        text path
        timestamp created_at
    }
    
    visitor_daily_stats {
        date day PK
        text path PK
        integer total_events
        integer unique_visitors
    }
    
    admin_notifications {
        text id PK
        text title
        text message
        boolean is_read
        timestamp read_at
        timestamp created_at
    }
    
    user_notifications {
        text id PK
        uuid user_id FK
        text title
        text message
        text status
        timestamp delivered_at
        timestamp read_at
    }
    
    billing_transactions {
        text id PK
        uuid user_id FK
        text invoice_id
        text status
        timestamp created_at
        timestamp paid_at
        timestamp expired_at
    }
    
    cleanup_logs ||--o{ visitor_events : tracks
    cleanup_logs ||--o{ visitor_daily_stats : tracks
    cleanup_logs ||--o{ admin_notifications : tracks
    cleanup_logs ||--o{ user_notifications : tracks
    cleanup_logs ||--o{ billing_transactions : tracks
```

---

## ⏱️ Cleanup Schedule

### Cron Schedule Timeline

```mermaid
gantt
    title Daily Cleanup Schedule
    dateFormat HH:mm
    axisFormat %H:%M
    
    section Daily Cleanup
    visitor_events cleanup           :02:00, 5m
    visitor_daily_stats cleanup      :02:05, 3m
    admin_notifications cleanup      :02:08, 2m
    user_notifications cleanup       :02:10, 2m
    
    section Weekly Cleanup
    billing_transactions cleanup     :crit, 04:00, 5m
```

---

## 🔍 Monitoring Flow

### Monitoring & Alerting Flow

```mermaid
graph LR
    A[Cleanup Functions] -->|Log Results| B[cleanup_logs table]
    B -->|Query| C[get_cleanup_summary]
    B -->|Query| D[get_table_sizes]
    
    C --> E[Daily Health Check]
    D --> F[Weekly Size Report]
    
    E -->|Success Rate < 100%| G[Alert: Cleanup Failed]
    E -->|Last Run > 2 days| H[Alert: Cron Not Running]
    
    F -->|Size Increasing| I[Alert: Cleanup Ineffective]
    F -->|Size Stable| J[Status: OK]
    
    G --> K[Developer Investigation]
    H --> K
    I --> K
    J --> L[Continue Monitoring]
```

---

## 🎯 Decision Tree

### Cleanup Strategy Decision Tree

```mermaid
graph TD
    A[New Table] --> B{Critical Data?}
    B -->|Yes| C[NO Auto-Cleanup]
    B -->|No| D{Data Type?}
    
    D -->|Analytics/Logs| E{Volume?}
    D -->|Temporary| F[Time-Based Cleanup]
    
    E -->|High Volume| G[Row-Limit Cleanup]
    E -->|Low Volume| H[Time-Based Cleanup]
    
    C --> I[Manual Cleanup Only]
    F --> J[Set Retention Days]
    G --> K[Set Max Rows]
    H --> J
    
    J --> L[Create Cleanup Function]
    K --> L
    
    L --> M[Add to run_all_cleanups]
    M --> N[Test in Staging]
    N --> O[Deploy to Production]
```

---

## 📊 Data Lifecycle

### Data Retention Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Data Created
    
    Active --> Eligible: Age > Retention Period
    Active --> Eligible: Count > Max Rows
    
    Eligible --> Cleanup: Cron Trigger
    
    Cleanup --> Deleted: Cleanup Success
    Cleanup --> Error: Cleanup Failed
    
    Error --> Retry: Next Cron Run
    Retry --> Deleted: Success
    Retry --> Error: Failed Again
    
    Deleted --> Logged: Log to cleanup_logs
    Logged --> [*]
    
    note right of Active
        visitor_events: 14 days
        notifications: 30 days
        transactions: 90 days
    end note
    
    note right of Cleanup
        Runs daily at 2AM WIB
        via pg_cron
    end note
```

---

## 🔄 Cleanup Function Flow

### Individual Cleanup Function Flow

```mermaid
flowchart TD
    Start([Function Called]) --> Init[Initialize Variables]
    Init --> StartTimer[Start Timer]
    
    StartTimer --> Delete{Execute DELETE Query}
    
    Delete -->|Success| Count[Get Rows Deleted Count]
    Delete -->|Error| Catch[Catch Exception]
    
    Count --> CalcTime[Calculate Execution Time]
    CalcTime --> LogSuccess[Insert Success Log]
    LogSuccess --> ReturnSuccess[Return Success JSON]
    ReturnSuccess --> End([End])
    
    Catch --> LogError[Insert Error Log]
    LogError --> ReturnError[Return Error JSON]
    ReturnError --> End
    
    style Delete fill:#90EE90
    style Catch fill:#FFB6C1
    style LogSuccess fill:#87CEEB
    style LogError fill:#FFA07A
```

---

## 🏗️ Implementation Phases

### Implementation Timeline

```mermaid
gantt
    title Database Cleanup Implementation Timeline
    dateFormat YYYY-MM-DD
    
    section Phase 1: Preparation
    Backup Database           :done, p1, 2026-05-08, 1d
    Review Schema            :done, p2, 2026-05-08, 1d
    Create Staging Env       :done, p3, 2026-05-08, 1d
    
    section Phase 2: Development
    Create cleanup_logs      :active, p4, 2026-05-09, 1d
    Add Indexes             :p5, after p4, 1d
    Create Functions        :p6, after p5, 2d
    
    section Phase 3: Testing
    Test in Staging         :p7, after p6, 2d
    Performance Testing     :p8, after p7, 1d
    
    section Phase 4: Deployment
    Deploy to Production    :crit, p9, after p8, 1d
    Setup Cron Jobs        :crit, p10, after p9, 1d
    
    section Phase 5: Monitoring
    Monitor First Week      :p11, after p10, 7d
    Adjust if Needed       :p12, after p11, 3d
```

---

## 🎨 Table Size Visualization

### Expected Storage Reduction

```mermaid
graph LR
    subgraph Before Cleanup
        A1[visitor_events<br/>5 GB] 
        A2[visitor_daily_stats<br/>2 GB]
        A3[notifications<br/>1 GB]
        A4[transactions<br/>3 GB]
    end
    
    subgraph After Cleanup
        B1[visitor_events<br/>1.5 GB<br/>-70%]
        B2[visitor_daily_stats<br/>1 GB<br/>-50%]
        B3[notifications<br/>600 MB<br/>-40%]
        B4[transactions<br/>2.1 GB<br/>-30%]
    end
    
    A1 -.->|Cleanup| B1
    A2 -.->|Cleanup| B2
    A3 -.->|Cleanup| B3
    A4 -.->|Cleanup| B4
    
    style B1 fill:#90EE90
    style B2 fill:#90EE90
    style B3 fill:#90EE90
    style B4 fill:#90EE90
```

---

## 🔐 Security & Permissions

### Permission Model

```mermaid
graph TD
    A[Cleanup Functions] --> B{Permission Check}
    
    B -->|Has DELETE| C[Execute Cleanup]
    B -->|No DELETE| D[Permission Denied]
    
    C --> E{Has INSERT on cleanup_logs}
    E -->|Yes| F[Log Result]
    E -->|No| G[Cannot Log]
    
    F --> H[Success]
    G --> I[Warning: No Audit Trail]
    D --> J[Error]
    
    style H fill:#90EE90
    style I fill:#FFD700
    style J fill:#FFB6C1
```

---

## 📈 Monitoring Dashboard Concept

### Ideal Monitoring Dashboard Layout

```mermaid
graph TB
    subgraph Dashboard
        A[Cleanup Status Widget]
        B[Table Sizes Widget]
        C[Cleanup History Chart]
        D[Error Alerts Widget]
        
        A --> A1[Last Run: 2 hours ago]
        A --> A2[Status: Success]
        A --> A3[Rows Deleted: 1,234]
        
        B --> B1[visitor_events: 1.5 GB]
        B --> B2[notifications: 600 MB]
        B --> B3[transactions: 2.1 GB]
        
        C --> C1[Line Chart: Rows Deleted Over Time]
        C --> C2[Bar Chart: Execution Time]
        
        D --> D1[No Active Errors]
        D --> D2[Last Error: 7 days ago]
    end
    
    style A fill:#87CEEB
    style B fill:#90EE90
    style C fill:#FFD700
    style D fill:#FFB6C1
```

---

## 🔄 Rollback Strategy

### Rollback Decision Flow

```mermaid
flowchart TD
    A[Issue Detected] --> B{Severity?}
    
    B -->|Critical| C[Immediate Rollback]
    B -->|Medium| D[Investigate First]
    B -->|Low| E[Monitor & Fix]
    
    C --> F[Unschedule Cron Jobs]
    F --> G[Disable Functions]
    G --> H[Restore from Backup]
    H --> I[Verify Data Integrity]
    I --> J[Notify Team]
    
    D --> K[Check Cleanup Logs]
    K --> L{Data Loss?}
    L -->|Yes| C
    L -->|No| M[Adjust & Retry]
    
    E --> N[Document Issue]
    N --> O[Schedule Fix]
    
    style C fill:#FFB6C1
    style H fill:#FFD700
    style M fill:#90EE90
```

---

## 📊 Performance Metrics

### Key Performance Indicators

```mermaid
graph LR
    subgraph Input Metrics
        A1[Table Row Count]
        A2[Table Size GB]
        A3[Query Response Time]
    end
    
    subgraph Cleanup Process
        B1[Cleanup Execution]
        B2[Rows Deleted]
        B3[Execution Time]
    end
    
    subgraph Output Metrics
        C1[Storage Reduction %]
        C2[Query Speed Improvement %]
        C3[Success Rate %]
    end
    
    A1 --> B1
    A2 --> B1
    A3 --> B1
    
    B1 --> B2
    B1 --> B3
    
    B2 --> C1
    B3 --> C2
    B1 --> C3
    
    C1 --> D[Target: 40-60% reduction]
    C2 --> E[Target: 20-40% faster]
    C3 --> F[Target: 100% success]
    
    style D fill:#90EE90
    style E fill:#90EE90
    style F fill:#90EE90
```

---

**Architecture Diagrams Version**: 1.0  
**Last Updated**: 2026-05-08  
**Format**: Mermaid Diagrams
