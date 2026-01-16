
export enum RoboMode {
  Companion = 'Companion',
  Student = 'Student',
  Teacher = 'Teacher',
  TeacherPhysics = 'Physics Teacher',
  TeacherChemistry = 'Chemistry Teacher',
  TeacherMaths = 'Maths Teacher',
  TeacherComputer = 'Computer Teacher',
  TeacherRealLife = 'Real-Life Teacher',
  Manager = 'Manager',
  Developer = 'Developer',
  Spiritual = 'Spiritual',
  Historian = 'Historian',
  Research = 'Research',
  Kitchen = 'Kitchen',
  HealthAdvisor = 'Health Advisor',
  SongPlayer = 'Song Player'
}

export type HardwareCommand = 
  | 'MOVE_FORWARD' 
  | 'MOVE_BACKWARD' 
  | 'TURN_LEFT' 
  | 'TURN_RIGHT' 
  | 'FORWARD_LEFT' 
  | 'FORWARD_RIGHT' 
  | 'BACKWARD_LEFT' 
  | 'BACKWARD_RIGHT' 
  | 'STOP' 
  | 'COME_TO_ME' 
  | 'FOLLOW_MODE_ON' 
  | 'FOLLOW_MODE_OFF';

export interface Message {
  role: 'user' | 'bot';
  content: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  preferredMode: RoboMode;
  lastCheckInDate: string | null;
  summary: string;
}

export type RoboExpression = 'neutral' | 'listening' | 'thinking' | 'smiling' | 'sad' | 'surprised' | 'scanning';

/* Added missing properties to RoboStatusProps to match properties passed in App.tsx */
export interface RoboStatusProps {
  status: 'idle' | 'listening' | 'speaking' | 'connecting';
  mode: RoboMode;
  isActive: boolean;
  expression?: RoboExpression;
  isMusicPlaying?: boolean;
  analyser?: AnalyserNode | null;
}
