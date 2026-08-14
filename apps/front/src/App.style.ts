import { createGlobalStyle } from "styled-components";

const AppStyle = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Apple SD Gothic Neo", Arial, '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
  }
  :root {
    --point-color: #E1FF8E;
    --font-color: #000;
    --font-sub-color: #666;
    --font-red-color: #F44E4C;
    --main-color: #2A6CCE;
    --nav-color: #1d5ab7;
    --link-color: #007BFF;
    --table-line-color: #B6BDC8;
    --table-bg-color: #EAF0F8;
    --bg-hover-color: #ffffe9;
    --bg-warning-color: #ffebeb;
    --bg-color: #ffffff;
    --bg-sub-color: #F5F6FA;
    --box-bg-color: #F2F7FC;
    --box-bg-color: #CBDAEE;
    --box-inbg-color: #ffffff;
    --tab-color: #F5F6FA;
    --line-color: #B6BDC8;
    --btn-color: #2670DF;
    --btn-hover-color: #3b86ff;
    --bg-card-color: #ffffff;
    --bg-dashboard: #F5F6FA;
    --bg-box-color: #f9f9f9;
    --bg-searchbox-color: #E4EEF9;
    --line-searchbox-color: #93A5BD;
    --popup-input-line-color: #B6BDC8;
  }
  /* :root {
    --jqx-grid-row-height: 36px;
    --jqx-grid-column-height: 48px;
    --jqx-grid-show-column-lines: 1;
    --jqx-list-item-height: -1;
    --jqx-grid-filter-menu-items-height: 30px;
    --jqx-dropdown-animation: transform;
    --jqx-datetimeinput-dropdown-height: 280px;
    --jqx-datetimeinput-dropdown-width: 280px;
    --jqx-calendar-header-height: 40px;
    --jqx-calendar-title-height: 49px;
    --jqx-icon-calendar: '\e829';
    --jqx-icon-filter: '\f0b0';
    --jqx-icon-menu: '\f0c9';
    --jqx-icon-check: '\e908';
    --jqx-icon-first-page: '\e900';
    --jqx-icon-arrow-down: '\e901';
    --jqx-icon-arrow-left: '\e902';
    --jqx-icon-arrow-right: '\e903';
    --jqx-icon-arrow-up: '\e904';
    --jqx-icon-arrow-down-filled: '\e812';
    --jqx-icon-arrow-left-filled: '\e816';
    --jqx-icon-arrow-right-filled: '\e81e';
    --jqx-icon-arrow-up-filled: '\e815';
    --jqx-icon-visibility: '\e90d';
    --jqx-icon-visibility-off: '\e90e';
    --jqx-icon-last-page: '\e905';
    --jqx-icon-close: '\e80d';
    --jqx-icon-search: '\e828';
    --jqx-border-radius: 4px;
    --jqx-font-family: "Roboto", "Helvetica Neue", Helvetica, Arial, sans-serif;
    --jqx-font-size: 14px;
    --jqx-action-button-size: 25px;
  } */
  a {
    color: inherit;
  }

  body {
    font-size: 15px;
    color: #000;
  }
`;

export default AppStyle;
