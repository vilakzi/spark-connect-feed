import { validatePassword } from '@/lib/securityUtils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength = ({ password, className = "" }: PasswordStrengthProps) => {
  if (!password) return null;

  const validation = validatePassword(password);
  const checks = [
    { test: password.length >= 8, label: "At least 8 characters" },
    { test: /(?=.*[a-z])/.test(password), label: "One lowercase letter" },
    { test: /(?=.*[A-Z])/.test(password), label: "One uppercase letter" },
    { test: /(?=.*\d)/.test(password), label: "One number" }
  ];

  const passedChecks = checks.filter(check => check.test).length;
  const strength = passedChecks === 4 ? 'Strong' : passedChecks >= 2 ? 'Medium' : 'Weak';
  
  const strengthColor = strength === 'Strong' ? 'text-green-600' : 
                       strength === 'Medium' ? 'text-yellow-600' : 'text-red-600';

  const barColor = strength === 'Strong' ? 'bg-green-500' : 
                  strength === 'Medium' ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Password Strength</span>
        <span className={`text-sm font-medium ${strengthColor}`}>{strength}</span>
      </div>
      
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${(passedChecks / 4) * 100}%` }}
        />
      </div>
      
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center text-xs">
            <div className={`w-2 h-2 rounded-full mr-2 ${check.test ? 'bg-green-500' : 'bg-muted'}`} />
            <span className={check.test ? 'text-muted-foreground' : 'text-muted-foreground/60'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
      
      {!validation.isValid && validation.message && (
        <p className="text-xs text-red-600">{validation.message}</p>
      )}
    </div>
  );
};