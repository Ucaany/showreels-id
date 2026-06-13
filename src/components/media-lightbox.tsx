"use client";

import Lightbox from "yet-another-react-lightbox";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";

export function MediaLightbox({
  open,
  index,
  slides,
  onClose,
}: {
  open: boolean;
  index: number;
  slides: Array<{ src: string }>;
  onClose: () => void;
}) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={slides}
      plugins={[Zoom, Fullscreen]}
      carousel={{ finite: slides.length <= 1 }}
    />
  );
}
