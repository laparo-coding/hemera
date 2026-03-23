'use client';

import { RedirectToSignIn, Show, UserProfile } from '@clerk/nextjs';

export default function UserProfilePage() {
  return (
    <div className='flex justify-center py-8'>
      <Show when='signed-in'>
        <UserProfile path='/user-profile' />
      </Show>
      <Show when='signed-out'>
        <RedirectToSignIn />
      </Show>
    </div>
  );
}
