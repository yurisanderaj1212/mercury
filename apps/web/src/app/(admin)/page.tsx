'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRootPage(): React.JSX.Element {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/users');
  }, [router]);

  return <></>;
}
