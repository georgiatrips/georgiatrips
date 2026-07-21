import Image from "next/image";

// ============================================================
// SHARED CONFIG & HELPERS
// ============================================================
export const WA_NUMBER = "995555000000"; // Change to real WhatsApp number
export const WA_LINK = `https://wa.me/${WA_NUMBER}`;

// Brand logo — uses the uploaded logo.png asset
export const BrandLogo = ({ width = 48, height = 48, priority = false }) => (
  <Image
    src="/logo.png"
    alt="GeorgiaTrips ლოგო"
    width={width}
    height={height}
    priority={priority}
    className="brand-logo-img"
    style={{ width, height, objectFit: "contain" }}
  />
);

// WhatsApp icon
export const WhatsAppIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12.003 2C6.477 2 2 6.477 2 12c0 1.989.574 3.842 1.563 5.406L2 22l4.682-1.528A9.956 9.956 0 0012.003 22C17.529 22 22 17.523 22 12S17.529 2 12.003 2zm0 18c-1.676 0-3.26-.455-4.627-1.247l-.331-.198-3.454 1.128 1.156-3.366-.215-.348A7.957 7.957 0 014.003 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z" />
  </svg>
);

// Send a WhatsApp booking message for a specific tour
export const bookTourOnWhatsApp = (tourTitle, tourPrice) => {
  const msg = `გამარჯობა! მინდა დავაჯავშნო ტური: *${tourTitle}*${tourPrice ? ` (${tourPrice})` : ""}`;
  window.open(`${WA_LINK}?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
};
