'use client';

import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserProfile,
} from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className='flex justify-center py-8'>
      <SignedIn>
        <UserProfile path='/user-profile' />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </div>
  );
}
