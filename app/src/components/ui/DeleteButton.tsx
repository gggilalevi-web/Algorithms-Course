'use client'

interface DeleteButtonProps {
  action: () => Promise<void>
  label: string
  confirmMessage: string
}

export default function DeleteButton({ action, label, confirmMessage }: DeleteButtonProps) {
  return (
    <form
      action={async () => {
        if (!confirm(confirmMessage)) return
        await action()
      }}
    >
      <button
        type="submit"
        className="border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm"
      >
        {label}
      </button>
    </form>
  )
}
