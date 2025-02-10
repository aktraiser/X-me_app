'use client';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <main className="bg-light-primary dark:bg-dark-primary min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6">
        {children}
      </div>
    </main>
  );
};

export default AuthLayout; 