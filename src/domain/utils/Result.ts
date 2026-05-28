export type Success<T> = { value: T, error: null }
export type Failure<E extends Error> = { value: null, error: E }

export type Result<T, E extends Error = Error> = Success<T> | Failure<E>

export function succeed<T>(value: T): Success<T> {
	return { value, error: null }
}

export function fail<E extends Error = Error>(error: E): Failure<E> {
	return { value: null, error }
}
