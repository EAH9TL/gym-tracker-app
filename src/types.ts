// src/types.ts

export interface Profile {
  id: string;
  is_admin: boolean;
}

// --- INTERFAZ DE EXERCISE ACTUALIZADA ---
export interface Exercise {
  id: number;
  created_at: string;
  name: string;
  body_section: 'Superior' | 'Inferior';
  notes?: string;
  sets_reps?: string | null;
  rir?: number | null;
  user_id: string;
}

export type ExerciseInsert = Omit<Exercise, 'id' | 'created_at' | 'user_id'>;

export type Difficulty = 'Fácil' | 'Medio' | 'Difícil';
export interface WorkoutLog {
  id: number;
  created_at: string;
  exercise_id: number;
  weight_kg: number; // Ahora solo guardamos el peso
  user_id: string;
  difficulty?: Difficulty | null;
}

export type WorkoutLogInsert = Omit<
  WorkoutLog,
  'id' | 'created_at' | 'user_id'
>;

// Interfaz para cuando queramos recuperar logs con la info del ejercicio
export interface WorkoutLogWithExercise extends WorkoutLog {
  exercises: {
    name: string;
    body_section: 'Superior' | 'Inferior';
    // Traemos también la prescripción del ejercicio
    sets_reps?: string | null;
    rir?: number | null;
  };
}
