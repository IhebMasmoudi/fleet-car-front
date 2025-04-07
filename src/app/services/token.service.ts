import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  /**
   * Get the JWT token from local storage.
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Set the JWT token in local storage.
   */
  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Remove the token from local storage.
   */
  removeToken(): void {
    localStorage.removeItem('token');
  }

  /**
   * Get the user role from local storage.
   */
  getRole(): string | null {
    return localStorage.getItem('role');
  }

  /**
   * Set the user role in local storage.
   */
  setRole(role: string): void {
    localStorage.setItem('role', role);
  }

  /**
   * Get the user ID from local storage.
   */
  getUserId(): string | null {
    return localStorage.getItem('userId');
  }

  /**
   * Set the user ID in local storage.
   */
  setUserId(userId: string): void {
    localStorage.setItem('userId', userId);
  }

  /**
   * Get the user name from local storage.
   */
  getUserName(): string | null {
    return localStorage.getItem('userName');
  }

  /**
   * Set the user name in local storage.
   */
  setUserName(userName: string): void {
    localStorage.setItem('userName', userName);
  }
}