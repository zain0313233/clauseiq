export interface AuthResponseDto {
  user: {
    id: string
    name: string | null
    email: string
  }
  token: string
}

export interface ErrorResponseDto {
  error: string
}