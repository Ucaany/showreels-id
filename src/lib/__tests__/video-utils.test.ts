import {
  detectVideoSource,
  getEmbedReadyVideoUrl,
  getEmbedUrl,
} from "@/lib/video-utils";

describe("video-utils embed-ready URL parsing", () => {
  it("parses YouTube watch and youtu.be URLs", () => {
    const watch = getEmbedReadyVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(watch?.source).toBe("youtube");
    expect(watch?.embedUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");

    const short = getEmbedReadyVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(short?.source).toBe("youtube");
    expect(short?.embedUrl).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
  });

  it("parses Google Drive file URL into preview embed", () => {
    const drive = getEmbedReadyVideoUrl("https://drive.google.com/file/d/1AbCdEfGhIJkLmNoPqRstuVwXyZ/view");
    expect(drive?.source).toBe("gdrive");
    expect(drive?.embedUrl).toBe(
      "https://drive.google.com/file/d/1AbCdEfGhIJkLmNoPqRstuVwXyZ/preview"
    );
  });

  it("parses Instagram reel URL into embed URL", () => {
    const instagram = getEmbedReadyVideoUrl("https://www.instagram.com/reel/C9abcdEF12_/" );
    expect(instagram?.source).toBe("instagram");
    expect(instagram?.embedUrl).toBe("https://www.instagram.com/reel/C9abcdEF12_/embed");
  });

  it("parses Facebook watch URL into plugin embed URL", () => {
    const facebook = getEmbedReadyVideoUrl("https://www.facebook.com/watch/?v=1234567890123456");
    expect(facebook?.source).toBe("facebook");
    expect(facebook?.embedUrl).toBe(
      "https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Fwatch%2F%3Fv%3D1234567890123456&show_text=0"
    );
  });

  it("parses TikTok full video URL into embed URL", () => {
    const tiktok = getEmbedReadyVideoUrl("https://www.tiktok.com/@creator/video/7381234567890123456");
    expect(tiktok?.source).toBe("tiktok");
    expect(tiktok?.embedUrl).toBe("https://www.tiktok.com/embed/v2/7381234567890123456");
  });

  it("does not treat profile links as embeddable video URLs", () => {
    expect(detectVideoSource("https://www.instagram.com/creatorprofile/")).toBeNull();
    expect(detectVideoSource("https://www.facebook.com/creatorpage")).toBeNull();
    expect(detectVideoSource("https://www.youtube.com/@creatorchannel")).toBeNull();
  });

  it("does not generate invalid embed from vm.tiktok shortlink", () => {
    expect(getEmbedReadyVideoUrl("https://vm.tiktok.com/ZM123AbCd/")).toBeNull();
  });

  it("returns original URL as fallback when source and URL mismatch", () => {
    const original = "https://example.com/not-an-embed-url";
    expect(getEmbedUrl(original, "youtube")).toBe(original);
  });
});
