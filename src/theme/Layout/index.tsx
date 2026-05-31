import React from 'react';
import OriginalLayout from '@theme-original/Layout';
import {useLocation} from '@docusaurus/router';

export default function LayoutWrapper(props: any) {
  const location = useLocation();

  const isHomePage =
    location.pathname === '/' ||
    location.pathname === '/zh-Hans/';

  return (
    <OriginalLayout
      {...props}
      noFooter={!isHomePage}
    />
  );
}