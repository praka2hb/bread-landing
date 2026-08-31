import Image from "next/image";

export function AppPreviewSection() {
  return (
    <section aria-label="Bread app preview" className="bg-white">
      <Image
        src="/bread-app-preview.png"
        alt="Bread app preview showing a social post transformed into a tracked trade"
        width={1881}
        height={1310}
        sizes="100vw"
        className="mx-auto block h-auto w-full max-w-[1881px]"
      />
    </section>
  );
}
