import { Reveal } from './Reveal';

export interface GalleryImage {
  src: string;
  alt: string;
}

export function Gallery({ images }: { images: GalleryImage[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((img, i) => (
        <Reveal key={img.src} delay={(i % 3) * 0.05}>
          <div className="group aspect-square overflow-hidden rounded-md border border-line bg-line/40">
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="editorial-img h-full w-full object-cover transition-transform duration-700 ease-editorial group-hover:scale-[1.04]"
            />
          </div>
        </Reveal>
      ))}
    </div>
  );
}
