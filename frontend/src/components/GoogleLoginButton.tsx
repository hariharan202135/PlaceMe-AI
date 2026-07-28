'use client';

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/context/AuthContext';

interface GoogleLoginButtonProps {
  onError: (msg: string) => void;
  onLoadingChange: (loading: boolean) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}

export default function GoogleLoginButton({ onError, onLoadingChange, text = 'continue_with' }: GoogleLoginButtonProps) {
  const { googleLogin } = useAuth();

  return (
    <div className="w-full flex justify-center overflow-hidden rounded-xl">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (credentialResponse.credential) {
            onLoadingChange(true);
            const res = await googleLogin(credentialResponse.credential);
            onLoadingChange(false);
            if (!res.success) {
              onError(res.message || 'Google authentication failed.');
            }
          }
        }}
        onError={() => {
          onError('Google Sign-In failed or popup was closed.');
        }}
        theme="filled_blue"
        shape="circle"
        size="large"
        text={text}
        width="100%"
      />
    </div>
  );
}
