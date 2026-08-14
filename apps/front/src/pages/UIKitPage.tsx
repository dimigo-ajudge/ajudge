import { useState } from "react";
import styled from "styled-components";
import { Row, Text, UIButton, UIDivider } from "../components/ui";

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  overflow: auto;
  padding: 40px 32px 64px;
  text-align: left;
`;

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 920px;
`;

export default function UiKitPage() {
  const [agree, setAgree] = useState(false);

  return (
    <Wrapper>
      <Section>
        <span>
          UI Components
        </span>
        <UIDivider size="Small" />

        <Text variant="callout" weight="strong">
          Buttons
        </Text>
        <Row>
          <UIButton>Primary</UIButton>
          <UIButton $variant="secondary">Secondary</UIButton>
          <UIButton disabled>Disabled</UIButton>
        </Row>

        <Text variant="callout" weight="strong">
          Badges & Controls
        </Text>
        <Row>
          <label>
            <input
              checked={agree}
              onChange={(event) => setAgree(event.target.checked)}
              type="checkbox"
            />{" "}
            Agree: {agree ? "Yes" : "No"}
          </label>
        </Row>
      </Section>
    </Wrapper>
  );
}
