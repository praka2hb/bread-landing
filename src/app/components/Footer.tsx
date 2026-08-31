import Image from "next/image";

export function Footer() {
  return (
    <footer
      id="waitlist"
      style={{
        position: "relative",
        background: "#16161a",
        color: "#ffffff",
        padding: "80px 24px 40px",
        overflow: "hidden",
        fontFamily: "var(--font-primary)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
        }}
      >
        {/* copy */}
        <div style={{ flex: "1 1 320px", minWidth: 280 }}>
          <h2
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 16,
            }}
          >
            Stack your bread. 🍞
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 420,
              marginBottom: 28,
            }}
          >
            Save smarter, spend wiser, and watch your jar fill up. Bread keeps
            every coin and bill working for you.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <a
              href="/sandwiches"
              style={{
                background: "var(--lime)",
                color: "#16161a",
                fontWeight: 600,
                fontSize: 15,
                padding: "12px 24px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              Get started
            </a>
            <a
              href="#"
              style={{
                border: "1px solid rgba(255,255,255,0.25)",
                color: "#ffffff",
                fontWeight: 600,
                fontSize: 15,
                padding: "12px 24px",
                borderRadius: 999,
                textDecoration: "none",
              }}
            >
              Top sandwiches
            </a>
          </div>
        </div>

        {/* money jar image */}
        <div
          style={{
            flex: "0 0 auto",
            display: "flex",
            justifyContent: "center",
            width: 240,
          }}
        >
          <Image
            src="/money-jar.png"
            alt="A glass jar filled with saved cash and coins"
            width={596}
            height={958}
            style={{
              height: "auto",
              width: "100%",
              maxWidth: 240,
              filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.45))",
            }}
            priority={false}
          />
        </div>
      </div>

      {/* bottom bar */}
      <div
        style={{
          maxWidth: 1100,
          margin: "56px auto 0",
          paddingTop: 24,
          borderTop: "1px solid rgba(255,255,255,0.12)",
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 14,
          color: "rgba(255,255,255,0.5)",
        }}
      >
        <span>© {new Date().getFullYear()} Bread. All rights reserved.</span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
            Privacy
          </a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
            Terms
          </a>
          <a href="#" style={{ color: "inherit", textDecoration: "none" }}>
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
