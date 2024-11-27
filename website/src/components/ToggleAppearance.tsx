import clsx from 'clsx'
import {useEffect, useState} from 'react'

const localStorageKey = 'data-appearance'
const options = ['light', 'dark', 'system']

export default function ToggleAppearance() {
  const [appearance, setAppearance] = useState<string>()

  useEffect(() => {
    setAppearance(localStorage.getItem(localStorageKey) ?? 'dark')
  }, [])

  const onToggleAppearance = (to?: string) => {
    const nextValue =
      to ||
      (appearance !== undefined && options[(options.indexOf(appearance) + 1) % options.length])
    if (!nextValue) return

    const success = dispatchEvent(new CustomEvent('set-appearance', {detail: nextValue}))
    if (success) setAppearance(nextValue)
  }

  return (
    <div className="h-8 rounded-full flex flex-row items-center sm:-mr-2">
      {options
        .toSorted((a, b) => b.length - a.length)
        .map((option) => (
          <button
            type="button"
            key={option}
            aria-label={option}
            onClick={() => onToggleAppearance(option)}
            className={clsx(
              'rounded-full border h-10 w-10 sm:h-8 sm:w-8 flex items-center justify-center mr-0 sm:-mr-0.5 last:mr-0',
              option === 'system' && 'hover:bg-gray-4 active:bg-gray-5 border-gray-6',
              option === 'light' && 'hover:bg-yellow-4 active:bg-yellow-5 border-yellow-6',
              option === 'dark' && 'hover:bg-blue-4 active:bg-blue-5 border-blue-6',
              option !== appearance && 'border-none',
              option === appearance &&
                ((option === 'system' && 'bg-gray-3a') ||
                  (option === 'light' && 'bg-yellow-3a') ||
                  (option === 'dark' && 'bg-blue-3a')),
            )}
          >
            <div
              className={clsx(
                option === 'system' && 'i-radix-icons-gear text-gray-11',
                option === 'light' && 'i-radix-icons-sun text-yellow-11',
                option === 'dark' && 'i-radix-icons-moon text-blue-11',
              )}
            />
          </button>
        ))}
    </div>
  )
}
