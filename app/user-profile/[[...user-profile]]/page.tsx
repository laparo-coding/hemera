'use client';

import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserProfile,
} from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className='flex min-h-screen justify-center px-4 pb-8 pt-24'>
      <SignedIn>
        <UserProfile path='/user-profile' />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}
