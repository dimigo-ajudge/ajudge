import { useEffect, useRef, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import "./App.css";
import { getGoogleLoginURL, googleLogin } from "./api/auth";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const analysisSteps = [
  ["01", "콘텐츠 수신", "플랫폼에서 영상·이미지·음성·텍스트를 전달받습니다."],
  ["02", "멀티모달 분리", "영상 프레임, 음성, 자막, 텍스트를 분석 단위로 분리합니다."],
  ["03", "출처·조작 확인", "메타데이터와 편집 이력, 딥페이크 신호를 분석합니다."],
  ["04", "핵심 주장 추출", "날짜·장소·인물·사건 등 검증할 문장을 추출합니다."],
  ["05", "근거 매칭", "공공기관·언론·신뢰 가능한 공개자료와 비교합니다."],
  ["06", "신뢰 정보 제공", "요소별 결과와 근거를 사용자에게 한눈에 보여줍니다."],
] as const;

const trustFeatures = [
  ["AI", "AI·딥페이크 탐지", "영상과 음성에서 합성·변조 흔적을 찾고 위험 수준을 표시합니다."],
  ["↗", "콘텐츠 출처 추적", "메타데이터, 콘텐츠 자격 증명, 재게시 경로를 비교합니다."],
  ["✓", "핵심 주장 검증", "사실 확인이 필요한 주장을 자동 추출하고 외부 근거와 연결합니다."],
  ["≡", "영상 한눈에 보기", "영상의 핵심 내용과 주요 주장, 검증 결과를 짧게 요약합니다."],
  ["▣", "신뢰 정보 카드", "플랫폼을 벗어나지 않고 출처·조작·주장·근거를 확인합니다."],
  ["⚙", "관리자 검토", "고위험·불확실 콘텐츠를 운영자가 검토하고 이의를 처리합니다."],
] as const;

function Brand() {
  return (
    <div className="brand" aria-label="Ajudge">
      <img src="/ajudge-mark.svg" alt="" />
      <span>Ajudge</span>
      <small>TrustLayer</small>
    </div>
  );
}

function TrustLayerBrand() {
  return (
    <div className="trustlayer-brand" aria-label="TrustLayer by Ajudge">
      <img src="/ajudge-mark.svg" alt="" />
      <span>TrustLayer</span>
      <small>by Ajudge</small>
    </div>
  );
}

function LandingPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-page" id="top">
      <nav className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <a href="#top" aria-label="TrustLayer home"><TrustLayerBrand /></a>
          <div className="landing-links">
            <a href="#why">필요성</a>
            <a href="#how">동작 방식</a>
            <a href="#features">핵심 기능</a>
            <a href="#platform">플랫폼 연동</a>
          </div>
          <a className="landing-nav-action" href={isAuthenticated ? "/workspace" : "/login"}>
            {isAuthenticated ? "Workspace" : "Sign in"}
          </a>
        </div>
      </nav>

      <header className="landing-hero">
        <div className="landing-container landing-hero-content">
          <p className="landing-pill">콘텐츠를 믿기 전에, 근거부터 확인하세요</p>
          <h1>플랫폼 위에 더하는<br /><span>AI 신뢰 레이어</span></h1>
          <p className="landing-hero-copy">
            TrustLayer는 영상·이미지·음성·텍스트를 자동 분석해 출처, 조작 가능성,
            핵심 주장과 근거를 한눈에 보여주는 플랫폼용 AI 신뢰 인프라입니다.
          </p>
          <div className="landing-actions">
            <a className="landing-button primary" href="#how">작동 방식 보기</a>
            <a className="landing-button light" href="#features">핵심 기능 보기</a>
          </div>
          <div className="landing-hero-preview" aria-label="TrustLayer 콘텐츠 분석 화면">
            <img src="/trustlayer-analysis.png" alt="TrustLayer 실제 콘텐츠 분석창" />
          </div>
        </div>
      </header>

      <section className="landing-section" id="why">
        <div className="landing-container">
          <div className="landing-section-heading">
            <p>WHY TRUSTLAYER</p>
            <h2>콘텐츠는 빨라졌지만,<br />검증은 여전히 느립니다.</h2>
            <span>생성형 AI와 합성 기술의 발전으로 그럴듯한 콘텐츠는 빠르게 늘어나지만, 사용자는 보는 순간 출처와 근거를 직접 확인하기 어렵습니다.</span>
          </div>
          <div className="landing-reason-grid">
            <article><i>AI</i><h3>조작 여부 확인</h3><p>영상과 음성에서 AI 생성·합성·변조 의심 신호를 탐지합니다.</p></article>
            <article><i>↗</i><h3>출처 확인</h3><p>메타데이터와 콘텐츠 자격 증명, 공개된 원본 경로를 추적합니다.</p></article>
            <article><i>✓</i><h3>주장 검증</h3><p>콘텐츠 속 핵심 주장을 추출하고 신뢰 가능한 공개 자료와 비교합니다.</p></article>
          </div>
        </div>
      </section>

      <section className="landing-section landing-alt" id="how">
        <div className="landing-container">
          <div className="landing-section-heading">
            <p>HOW IT WORKS</p>
            <h2>하나의 콘텐츠를 6단계로 분석합니다.</h2>
            <span>하나의 모델이 모든 것을 단정하는 대신 서로 다른 검증 신호를 종합해 근거 기반의 정보를 제공합니다.</span>
          </div>
          <div className="landing-flow">
            {analysisSteps.map(([number, title, description]) => (
              <article key={number}><span>{number}</span><h3>{title}</h3><p>{description}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-container">
          <div className="landing-section-heading">
            <p>CORE FEATURES</p>
            <h2>TrustLayer의 핵심 기능</h2>
          </div>
          <div className="landing-feature-grid">
            {trustFeatures.map(([icon, title, description]) => (
              <article key={title}>
                <i>{icon}</i>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-alt" id="experience">
        <div className="landing-container landing-experience">
          <div className="landing-experience-copy">
            <p className="landing-kicker">USER EXPERIENCE</p>
            <h2>별도 앱이 아니라,<br />플랫폼 안에서 바로 확인합니다.</h2>
            <p>사용자는 보고 있는 콘텐츠 옆의 신뢰 정보 버튼을 눌러 TrustLayer 분석창을 열 수 있습니다.</p>
            <ul>
              <li>작은 신뢰 정보 버튼으로 빠르게 접근</li>
              <li>콘텐츠 출처와 핵심 주장 바로 확인</li>
              <li>진짜·가짜 단정 대신 근거와 불확실성 제공</li>
            </ul>
          </div>
          <div className="landing-analysis-window">
            <div className="landing-window-bar"><TrustLayerBrand /><span>콘텐츠 분석</span></div>
            <div className="landing-summary">
              <div className="landing-score">84</div>
              <div><strong>대체로 신뢰할 수 있음</strong><span>출처·조작·핵심 주장 종합 결과</span></div>
            </div>
            <div className="landing-result"><i>AI</i><div><strong>AI·딥페이크 탐지</strong><span>뚜렷한 합성·변조 신호 없음</span></div><b className="result-good">이상 없음</b></div>
            <div className="landing-result"><i>↗</i><div><strong>콘텐츠 출처</strong><span>원본 및 재게시 경로 일부 확인</span></div><b className="result-info">바로가기</b></div>
            <div className="landing-result"><i>✓</i><div><strong>핵심 주장 검증</strong><span>3개 중 2개가 공개 근거와 일치</span></div><b className="result-warn">핵심 주장</b></div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="platform">
        <div className="landing-container">
          <div className="landing-section-heading">
            <p>PLATFORM INFRASTRUCTURE</p>
            <h2>플랫폼에 바로 붙이는 AI 신뢰 인프라</h2>
            <span>YouTube, Instagram, TikTok, 뉴스·커뮤니티 서비스가 공통으로 사용할 수 있는 API와 UI 컴포넌트를 목표로 합니다.</span>
          </div>
          <div className="landing-platform-grid">
            <article className="landing-api">
              <h3>TrustLayer API</h3>
              <p>콘텐츠 ID 또는 미디어 데이터를 전달하면 분석 결과를 구조화해 반환합니다.</p>
              <pre>{`POST /trust/analyze\n{\n  "content_type": "video",\n  "platform": "youtube_shorts",\n  "content_id": "EAOQLz1uUcU"\n}\n\n→ provenance / manipulation / claims / evidence / risk`}</pre>
            </article>
            <article className="landing-platform-value">
              <h3>플랫폼을 위한 구조</h3>
              <p>위험 신호를 자동 선별하고 필요한 콘텐츠에만 검증 정보를 노출합니다.</p>
              <div><span><b>API</b>기존 서비스 연동</span><span><b>UI</b>신뢰 정보 카드</span><span><b>Risk</b>고위험 우선 검토</span><span><b>Review</b>관리자 워크플로</span></div>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-container">
          <div>
            <h2>콘텐츠를 막는 것이 아니라,<br />판단할 근거를 더합니다.</h2>
            <p>TrustLayer는 사용자의 판단을 대신하지 않습니다. 출처와 근거, 조작 가능성을 투명하게 보여줍니다.</p>
            <a href={isAuthenticated ? "/workspace" : "/login"}>{isAuthenticated ? "Workspace 열기" : "TrustLayer 시작하기"}</a>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container"><TrustLayerBrand /><span>Platform AI Trust Infrastructure · Prototype</span></div>
      </footer>
    </div>
  );
}

function LoadingScreen() {
  return (
    <main className="centered-page" aria-live="polite">
      <div className="loader" aria-label="Loading" />
    </main>
  );
}

function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/workspace" replace />;

  const startLogin = async () => {
    setError("");
    setIsStarting(true);
    try {
      window.location.assign(await getGoogleLoginURL());
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Could not start login.");
      setIsStarting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <Brand />
        <div className="login-copy">
          <p className="eyebrow">AI trust infrastructure</p>
          <h1 id="login-title">Sign in to Ajudge</h1>
          <p>Use your Google account to access the TrustLayer workspace.</p>
        </div>
        <button className="google-button" type="button" onClick={startLogin} disabled={isStarting}>
          <span className="google-mark" aria-hidden="true">G</span>
          {isStarting ? "Opening Google..." : "Continue with Google"}
        </button>
        {error && <p className="error-message" role="alert">{error}</p>}
      </section>
      <aside className="signal-panel" aria-label="TrustLayer signal preview">
        <div className="signal-window">
          <div className="signal-window-bar">
            <Brand />
            <span>Live analysis</span>
          </div>
          <div className="signal-content">
            <div className="trust-ring"><strong>84</strong></div>
            <div>
              <p className="eyebrow">Content signal</p>
              <h2>Generally reliable</h2>
              <p>Source, context, and claim evidence are aligned.</p>
            </div>
          </div>
          <div className="metric-list" aria-hidden="true">
            <span><i className="metric-source" />Source integrity<strong>92</strong></span>
            <span><i className="metric-context" />Context match<strong>81</strong></span>
            <span><i className="metric-evidence" />Evidence quality<strong>78</strong></span>
          </div>
        </div>
      </aside>
    </main>
  );
}

function AuthCallbackPage() {
  const navigate = useNavigate();
  const { recheck } = useAuth();
  const started = useRef(false);
  const [code] = useState(() => new URLSearchParams(window.location.search).get("code"));
  const [error, setError] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error") || (params.get("code") ? "" : "Google did not return a login code.");
  });

  useEffect(() => {
    if (started.current || !code) return;
    started.current = true;

    googleLogin(code)
      .then(recheck)
      .then(() => navigate("/workspace", { replace: true }))
      .catch((callbackError: unknown) => {
        setError(callbackError instanceof Error ? callbackError.message : "Login failed.");
      });
  }, [code, navigate, recheck]);

  if (error) {
    return (
      <main className="centered-page">
        <section className="callback-panel">
          <Brand />
          <h1>Could not sign in</h1>
          <p className="error-message">{error}</p>
          <button type="button" onClick={() => navigate("/login", { replace: true })}>
            Back to login
          </button>
        </section>
      </main>
    );
  }

  return <LoadingScreen />;
}

function DashboardPage() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <button className="text-button" type="button" onClick={handleSignOut} disabled={isSigningOut}>
          {isSigningOut ? "Signing out..." : "Sign out"}
        </button>
      </header>
      <main className="dashboard">
        <section className="dashboard-heading">
          <p className="eyebrow">Workspace</p>
          <h1>Authentication</h1>
          <p>Your Ajudge services are connected to the same backend session.</p>
        </section>

        <section className="account-section" aria-labelledby="account-heading">
          <div className="section-heading">
            <div>
              <h2 id="account-heading">Google account</h2>
              <p>Active identity for this workspace</p>
            </div>
            <span className="status-badge"><i />Connected</span>
          </div>
          <div className="account-row">
            {user.picture ? (
              <img className="avatar" src={user.picture} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className="avatar avatar-fallback" aria-hidden="true">
                {(user.name || user.email || "A").charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <strong>{user.name || "Google user"}</strong>
              <span>{user.email || "Email unavailable"}</span>
            </div>
          </div>
        </section>

        <section className="service-section" aria-labelledby="services-heading">
          <div className="section-heading">
            <div>
              <h2 id="services-heading">Service status</h2>
              <p>Current authentication checks</p>
            </div>
          </div>
          <div className="service-list">
            <div><span>Backend API</span><strong><i />Available</strong></div>
            <div><span>Session</span><strong><i />Authenticated</strong></div>
            <div><span>Permissions</span><strong>Standard</strong></div>
          </div>
        </section>
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/workspace" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
