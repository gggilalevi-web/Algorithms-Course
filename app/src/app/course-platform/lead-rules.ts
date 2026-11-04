// Validation shared by the /course-platform form and POST /api/leads/course-platform.
// Phone and email rules are the same ones the wig-studio page uses.
export { PHONE_RE, EMAIL_MAX, normalizePhone, isValidPhone, isValidEmail } from '@/app/wig-studio/lead-rules'

// "Where does the course stand today" is required; these are the only accepted answers.
export const STAGES = ['עוד לא התחלתי', 'יש לי קורס במערכת אחרת', 'יש לי קורס בלי אתר', 'מוסד או סמינר'] as const
export const isValidStage = (value: string) => (STAGES as readonly string[]).includes(value)
