import { User } from '@/generated/prisma/client';
import { ApiResponse } from './api';

// User type without password
export type SafeUser = Omit<User, 'password'>;

// Login response data
export interface LoginResponseData {
  user: SafeUser;
  token: string;
}

// Login API response
export type LoginResponse = ApiResponse<LoginResponseData>;

// Register response data
export interface RegisterResponseData {
  user: SafeUser;
  token: string;
}

export type RegisterResponse = ApiResponse<RegisterResponseData>;

// Current user response
export interface CurrentUserResponseData {
  user: SafeUser;
}

export type CurrentUserResponse = ApiResponse<CurrentUserResponseData>;

// Profile update response
export interface UpdateProfileResponseData {
  user: SafeUser;
}

export type UpdateProfileResponse = ApiResponse<UpdateProfileResponseData>;