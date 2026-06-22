// src/types.ts

export interface Profile {
  id: string;
  is_admin: boolean;
}

export interface Exercise {
  id: number;
  created_at: string;
  name: string;
  body_section: 'Superior' | 'Inferior';
  notes?: string;
}

export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at'>;

export interface WorkoutLog {
  id: number;
  created_at: string;
  exercise_id: number;
  weight_kg: number;
  sets_reps: string;
  rir: number;
  user_id: string; // ID del usuario autenticado
}

export type WorkoutLogInsert = Omit<WorkoutLog, 'id' | 'created_at' | 'user_id'>;

// Relación útil para listar los entrenamientos junto al nombre de su ejercicio
export interface WorkoutLogWithExercise extends WorkoutLog {
  exercises: {
    name: string;
    body_section: 'Superior' | 'Inferior';
  };
}
