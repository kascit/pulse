import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query"
import { toast } from "sonner"

interface Options<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  invalidateQueryKeys?: QueryKey[]
  successText: string
  close?: () => void
  errorText?: string
  onSuccess?: (data: TData) => void
  onError?: (error: unknown) => void
}

export function useResourceMutation<TData = unknown, TVariables = unknown>({
  mutationFn,
  invalidateQueryKeys = [],
  successText,
  close,
  errorText,
  onSuccess,
  onError,
}: Options<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation<TData, unknown, TVariables>({
    mutationFn,
    onSuccess: (data) => {
      invalidateQueryKeys.forEach((queryKey) => queryClient.invalidateQueries({ queryKey }))
      close?.()
      onSuccess?.(data)
      toast.success(successText)
    },
    onError: (error) => {
      if (onError) {
        onError(error)
        return
      }
      const axiosError = error as any
      const message =
        axiosError?.response?.data?.error ??
        axiosError?.response?.data?.message ??
        (error instanceof Error ? error.message : null) ??
        errorText ??
        "Something went wrong"
      toast.error(String(message))
    },
  })
}
