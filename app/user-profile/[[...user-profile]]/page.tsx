'use client';

import { UserProfile } from '@clerk/nextjs';
import Link from 'next/link';
import { SignedIn, SignedOut } from '@/components/auth/ClerkComponents';

const signInLinkClassName = [
  'rounded-md bg-neutral-900 px-4 py-2 font-medium text-white transition',
  'hover:bg-neutral-700 focus:outline-none focus-visible:ring-2',
  'focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
].join(' ');

function SignedOutFallback() {
  return (
    <div className='flex min-h-64 flex-col items-center justify-center gap-3 text-center text-sm text-neutral-600'>
      <p aria-live='polite' className='text-base font-medium text-neutral-800'>
        Nicht angemeldet
      </p>
      <p>Bitte melde dich an, um dein Profil zu sehen.</p>
      <Link href='/sign-in' className={signInLinkClassName}>
        Anmelden
      </Link>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <div className='flex justify-center py-8'>
      <SignedIn>
        <UserProfile path='/user-profile' />
      </SignedIn>
      <SignedOut>
        <SignedOutFallback />
      </SignedOut>
    </div>
  );
}
