export type StaffRecord = {
  slug: string
  name: string
  role: 'principal' | 'fde'
  grade?: string
  specialty: string
  bio: string
  public: boolean
}

export const STAFF: StaffRecord[] = [
  {
    slug: 'shujian',
    name: '书剑',
    role: 'principal',
    specialty: '接现场、派驻场',
    bio: '剑来科技主理人。',
    public: true,
  },
]

export function publicStaff() {
  return STAFF.filter((item) => item.public)
}
