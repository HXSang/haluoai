
// clean and remove unused enums
export const PermissionNameType = {
    CREATE_USER: "CREATE_USER",
    UPDATE_USER: "UPDATE_USER",
    DELETE_USER: "DELETE_USER",
    GET_USER: "GET_USER",
    GET_USER_ARCHIVED: "GET_USER_ARCHIVED",
    UPDATE_USER_ARCHIVED: "UPDATE_USER_ARCHIVED",
    GET_ROLE: "GET_ROLE",
    GET_ROLES: "GET_ROLES",
    CREATE_ROLE: "CREATE_ROLE",
    UPDATE_ROLE: "UPDATE_ROLE",
    DELETE_ROLE: "DELETE_ROLE",
    GET_ROLE_ARCHIVED: "GET_ROLE_ARCHIVED",
    UPDATE_ROLE_ARCHIVED: "UPDATE_ROLE_ARCHIVED",
    GET_PERMISSIONS: "GET_PERMISSIONS",
    UPDATE_PERMISSION: "UPDATE_PERMISSION",
    CREATE_CLIENT: "CREATE_CLIENT",
    UPDATE_CLIENT: "UPDATE_CLIENT",
    GET_CLIENT: "GET_CLIENT",
    GET_CLIENT_ARCHIVED: "GET_CLIENT_ARCHIVED",
    UPDATE_CLIENT_ARCHIVED: "UPDATE_CLIENT_ARCHIVED",
    CREATE_JOB: "CREATE_JOB",
    UPDATE_JOB: "UPDATE_JOB",
    GET_JOB: "GET_JOB",
    GET_CATEGORY: "GET_CATEGORY",
    CREATE_CATEGORY: "CREATE_CATEGORY",
    UPDATE_CATEGORY: "UPDATE_CATEGORY",
    GET_TAG: "GET_TAG",
    CREATE_TAG: "CREATE_TAG",
    UPDATE_TAG: "UPDATE_TAG",
    GET_RECRUITER: "GET_RECRUITER",
    UPDATE_RECRUITER: "UPDATE_RECRUITER",
    GET_CANDIDATE: "GET_CANDIDATE",
    UPDATE_CANDIDATE: "UPDATE_CANDIDATE"
} as const;
export type PermissionNameType = (typeof PermissionNameType)[keyof typeof PermissionNameType];
export const UserType = {
    STAFF: "STAFF",
    RECRUITER: "RECRUITER"
} as const;
export type UserType = (typeof UserType)[keyof typeof UserType];
export const AuthType = {
    EMAIL: "EMAIL",
    GOOGLE: "GOOGLE"
} as const;
export type AuthType = (typeof AuthType)[keyof typeof AuthType];
export const JobOptionType = {
    PRIORITY: "PRIORITY",
    WORKING_TYPE: "WORKING_TYPE"
} as const;
export type JobOptionType = (typeof JobOptionType)[keyof typeof JobOptionType];
export const JobStatus = {
    OPEN: "OPEN",
    CLOSE: "CLOSE"
} as const;
export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];
export const JobOpenToDiscuss = {
    OPEN: "OPEN",
    CLOSE: "CLOSE"
} as const;
export type JobOpenToDiscuss = (typeof JobOpenToDiscuss)[keyof typeof JobOpenToDiscuss];
export const CategoryType = {
    RECRUITER: "RECRUITER",
    CANDIDATE_STATUS: "CANDIDATE_STATUS",
    APPLICATION_STATUS: "APPLICATION_STATUS"
} as const;
export type CategoryType = (typeof CategoryType)[keyof typeof CategoryType];
export const InteviewStatus = {
    AVAILABLE: "AVAILABLE",
    SELECT: "SELECT"
} as const;
export type InteviewStatus = (typeof InteviewStatus)[keyof typeof InteviewStatus];
export const CandidateResumeType = {
    SUMMARY: "SUMMARY",
    EXPERIENCE: "EXPERIENCE",
    SKILL: "SKILL",
    EDUCATION: "EDUCATION",
    PROJECT: "PROJECT",
    CERTIFICATION: "CERTIFICATION",
    LANGUAGE: "LANGUAGE"
} as const;
export type CandidateResumeType = (typeof CandidateResumeType)[keyof typeof CandidateResumeType];
export const ClientOptionType = {
    INDUSTRY: "INDUSTRY",
    SIZE: "SIZE",
    BUDGET: "BUDGET",
    STATUS: "STATUS"
} as const;
export type ClientOptionType = (typeof ClientOptionType)[keyof typeof ClientOptionType];
export const JobType = {
    REMOTE: "REMOTE",
    ON_SITE: "ON_SITE",
    HYBRID: "HYBRID"
} as const;
export type JobType = (typeof JobType)[keyof typeof JobType];
export const ApplicationStatus = {
    UNDER_REVIEW: "UNDER_REVIEW",
    SCREENING: "SCREENING",
    INTERVIEWING: "INTERVIEWING",
    OFFERED: "OFFERED",
    HIRED: "HIRED",
    PENDING: "PENDING",
    REJECTED: "REJECTED"
} as const;
export type ApplicationStatus = (typeof ApplicationStatus)[keyof typeof ApplicationStatus];
export const RewardUnitType = {
    VND: "VND",
    USD: "USD",
    PERCENT: "PERCENT"
} as const;
export type RewardUnitType = (typeof RewardUnitType)[keyof typeof RewardUnitType];
export const SalaryType = {
    NET: "NET",
    GROSS: "GROSS"
} as const;
export type SalaryType = (typeof SalaryType)[keyof typeof SalaryType];
