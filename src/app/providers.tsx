import React from "react";


interface Props {
  children: React.ReactNode;
}


export default function Providers({
  children
}: Props) {

  return (
    <>
      {children}
    </>
  );
}