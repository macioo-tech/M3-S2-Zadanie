export interface User {
  id: number;
  username: string;
  password: string; // Dla uproszczenia przechowujemy hasło w postaci jawnej (w praktyce należy stosować hashowanie)
  role: 'admin' | 'user';
  balance: number;
}

export interface Car {
  id: number;
  model: string;
  price: number;
  ownerId: string;
}

export type TypeMap = {
  users: User;
  cars: Car;
};

export interface TokenPayload {
  id: number;
  exp?: number;
}

export interface JSONResponse<T extends keyof TypeMap> {
  data?: TypeMap[T][] | TypeMap[T] | null;
  message?: string,
}