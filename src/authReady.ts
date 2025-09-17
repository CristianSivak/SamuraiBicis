// src/authReady.ts
import { auth } from "./firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

/**
 * Resuelve cuando Firebase Auth termina de determinar si hay sesión.
 * Devuelve el User activo o null si no hay sesión.
 */
export function authReady(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });
}