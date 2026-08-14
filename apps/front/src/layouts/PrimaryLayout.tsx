import type { ReactNode } from "react";
import styled from "styled-components";
import { useAuth } from "../contexts/AuthContext";

type PrimaryLayoutProps = {
  children: ReactNode;
};

const Main = styled.main`
  position: fixed;

  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;
`;

function PrimaryLayout({ children }: PrimaryLayoutProps) {
  const { isAuthenticated } = useAuth();
  return (
    <Main>
      {isAuthenticated && <NavigationBar />}
      {children}
    </Main>
  );
}

export default PrimaryLayout;
