import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, type Session } from "@supabase/supabase-js";
import { SignedInCompanion } from "../src/companion/CompanionPanel";
import "../src/prototype.css";
import "@fontsource/noto-sans-sc/400.css";
import "@fontsource/noto-serif-sc/400.css";

const config = { supabaseUrl: "https://history-fixture.supabase.co", supabaseAnonKey: "fixture-public-key", apiUrl: "https://api.wendao.test" };
const client = createClient(config.supabaseUrl, config.supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
function Fixture() {
  const language = new URLSearchParams(location.search).get("lang") === "en" ? "en" : "zh";
  const [user, setUser] = useState("11111111-1111-4111-8111-111111111111");
  const session = { user: { id: user }, access_token: "fixture-token" } as Session;
  return <>
    <button style={{ position: "fixed", top: 0, left: 0, zIndex: 1000 }} onClick={() => setUser("22222222-2222-4222-8222-222222222222")}>Switch fixture account</button>
    <div className="companion-layer" style={{ "--companion-viewport-height": "100dvh", "--companion-viewport-top": "0px" } as React.CSSProperties}>
      <section className="companion-dialog">
        <header className="companion-dialog-header"><div><h2>我的问道</h2></div><button>×</button></header>
        <div className="companion-dialog-body">
          <SignedInCompanion key={user} session={session} language={language} chapterId={8} client={client} config={config} onSignOut={async () => {}} onShareAnswer={(answer, chapterId) => sessionStorage.setItem("fixture-shared-answer", JSON.stringify({ answer, chapterId }))} />
        </div>
      </section>
    </div>
  </>;
}
createRoot(document.getElementById("root")!).render(<Fixture />);
