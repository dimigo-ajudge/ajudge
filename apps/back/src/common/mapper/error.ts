export const ErrorMsg = {
  UserIdentifier_NotFound: () => [
    "UserIdentifier_NotFound",
    "유저 식별 정보를 확인할 수 없습니다.",
  ],
  UserIdentifier_NotMatched: () => [
    "UserIdentifier_NotMatched",
    "유저 식별 정보가 일치하지 않습니다.",
  ],
  UserSession_NotFound: () => ["UserSession_NotFound", "유저 세션을 찾을 수 없습니다."],

  PermissionDenied_Resource: () => [
    "PermissionDenied_Resource",
    "이 리소스에 대한 권한이 없습니다.",
  ],
  PermissionDenied_Action: () => ["PermissionDenied_Action", "이 작업에 대한 권한이 없습니다."],

  Resource_NotFound: () => ["Resource_NotFound", "리소스를 찾을 수 없습니다."],
  ResourceAlreadyExists: () => ["ResourceAlreadyExists", "리소스가 이미 존재합니다."],

  InvalidParameter: () => ["InvalidParameter", "잘못된 매개변수가 있습니다."],

  GoogleOauthCode_Invalid: () => [
    "GoogleOauthCode_Invalid",
    "제공하신 OAuth 인증 코드가 유효하지 않습니다.",
  ],

  RateLimit_Exceeded: () => [
    "RateLimit_Exceeded",
    "초당 최대 요청 건수에 도달하였습니다. 잠시후에 다시 시도해주세요.",
  ],

  PersonalInformation_NotRegistered: () => [
    "PersonalInformation_NotRegistered",
    "먼저 가입을 진행하여주세요.",
  ],
};
