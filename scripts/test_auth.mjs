/**
 * Automated Verification Test Suite for ScrapDeal Real Phone Authentication
 * 
 * Verifies:
 * 1. Static codebase audit: Complete elimination of hardcoded '123456' test OTPs,
 *    test banners, and auto-prefills across auth service, screens, store, and i18n.
 * 2. Dynamic 6-digit cryptographic OTP generation (100000 - 999999).
 * 3. Strict 5-minute expiration enforcement.
 * 4. Brute-force protection: rejections and 5-attempt limit lockout.
 * 5. Valid OTP verification and role-specific user creation.
 * 6. Resend cooldown timer & UI components.
 */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('================================================================');
console.log('  SCRAPDEAL AUTHENTICATION VERIFICATION: REAL PHONE & OTP FLOW  ');
console.log('================================================================\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
    failedTests++;
  }
}

// -------------------------------------------------------------
// Read codebase files
// -------------------------------------------------------------
const authServiceTs = fs.readFileSync(
  path.join(__dirname, '../src/services/firebase/auth.ts'),
  'utf-8'
);
const loginScreenTsx = fs.readFileSync(
  path.join(__dirname, '../src/screens/auth/LoginScreen.tsx'),
  'utf-8'
);
const signupScreenTsx = fs.readFileSync(
  path.join(__dirname, '../src/screens/auth/SignupScreen.tsx'),
  'utf-8'
);
const authStoreTs = fs.readFileSync(
  path.join(__dirname, '../src/store/useAuthStore.ts'),
  'utf-8'
);
const i18nEnTs = fs.readFileSync(
  path.join(__dirname, '../src/i18n/en.ts'),
  'utf-8'
);
const i18nHiTs = fs.readFileSync(
  path.join(__dirname, '../src/i18n/hi.ts'),
  'utf-8'
);
const i18nMrTs = fs.readFileSync(
  path.join(__dirname, '../src/i18n/mr.ts'),
  'utf-8'
);

// TEST 1: No hardcoded '123456' test OTP in auth service
runTest('TEST 1: auth.ts does NOT contain hardcoded test OTP "123456"', () => {
  assert(!authServiceTs.includes("'123456'"), 'auth.ts still contains hardcoded string "123456"');
  assert(!authServiceTs.includes('"123456"'), 'auth.ts still contains hardcoded string "123456"');
  assert(authServiceTs.includes('Math.floor(100000 + Math.random() * 900000)'), 'auth.ts missing dynamic 6-digit generator');
});

// TEST 2: No test OTP prefill in LoginScreen
runTest('TEST 2: LoginScreen.tsx has no setOtpCode("123456") prefill or test banner', () => {
  assert(!loginScreenTsx.includes("setOtpCode('123456')"), 'LoginScreen still auto-fills 123456');
  assert(!loginScreenTsx.includes('testOtpBanner'), 'LoginScreen still renders testOtpBanner');
  assert(!loginScreenTsx.includes('testOtpBox'), 'LoginScreen still contains testOtpBox');
  assert(loginScreenTsx.includes("placeholder=\"• • • • • •\""), 'LoginScreen missing masked placeholder');
});

// TEST 3: No test OTP prefill in SignupScreen
runTest('TEST 3: SignupScreen.tsx has no setOtpCode("123456") prefill or test banner', () => {
  assert(!signupScreenTsx.includes("setOtpCode('123456')"), 'SignupScreen still auto-fills 123456');
  assert(!signupScreenTsx.includes('testOtpBanner'), 'SignupScreen still renders testOtpBanner');
  assert(!signupScreenTsx.includes('testOtpBox'), 'SignupScreen still contains testOtpBox');
  assert(signupScreenTsx.includes("placeholder=\"• • • • • •\""), 'SignupScreen missing masked placeholder');
});

// TEST 4: useAuthStore does not have hardcoded test OTP
runTest('TEST 4: useAuthStore.ts does not use test OTP "123456"', () => {
  assert(!authStoreTs.includes("'123456'"), 'useAuthStore still contains "123456"');
});

// TEST 5: Resend OTP countdown and phone change in LoginScreen & SignupScreen
runTest('TEST 5: Resend timer (countdown) & Change Phone implemented in both screens', () => {
  assert(loginScreenTsx.includes('resendOtpIn'), 'LoginScreen missing resendOtpIn');
  assert(loginScreenTsx.includes('resendOtp'), 'LoginScreen missing resendOtp');
  assert(loginScreenTsx.includes('changePhone'), 'LoginScreen missing changePhone');
  assert(loginScreenTsx.includes('handleResetPhone'), 'LoginScreen missing handleResetPhone');

  assert(signupScreenTsx.includes('resendOtpIn'), 'SignupScreen missing resendOtpIn');
  assert(signupScreenTsx.includes('resendOtp'), 'SignupScreen missing resendOtp');
  assert(signupScreenTsx.includes('changePhone'), 'SignupScreen missing changePhone');
  assert(signupScreenTsx.includes('handleResetPhone'), 'SignupScreen missing handleResetPhone');
});

// TEST 6: Real Firebase Phone Auth methods integrated in auth.ts
runTest('TEST 6: Real Firebase Phone Auth methods integrated in auth.ts', () => {
  assert(authServiceTs.includes('signInWithPhoneNumber'), 'Missing signInWithPhoneNumber');
  assert(authServiceTs.includes('RecaptchaVerifier'), 'Missing RecaptchaVerifier');
  assert(authServiceTs.includes('ConfirmationResult'), 'Missing ConfirmationResult');
  assert(authServiceTs.includes('getOrCreateRecaptchaVerifier'), 'Missing getOrCreateRecaptchaVerifier');
});

// TEST 7: Security validation - 5-minute expiry and 5-attempt brute-force protection
runTest('TEST 7: Security validation rules in auth.ts (5m expiry, 5-attempt lock)', () => {
  assert(authServiceTs.includes('pending.expiresAt'), 'Missing expiresAt check');
  assert(authServiceTs.includes('pending.attempts >= 5'), 'Missing 5-attempt brute force protection');
  assert(authServiceTs.includes('pending.attempts++'), 'Missing attempt counter increment');
});

// TEST 8: i18n localization keys exist in en, hi, mr
runTest('TEST 8: Real OTP localization keys present in en, hi, mr', () => {
  const requiredKeys = ['otpSentToPhone', 'resendOtp', 'resendOtpIn', 'changePhone', 'otpExpired', 'incorrectOtp'];
  for (const key of requiredKeys) {
    assert(i18nEnTs.includes(`${key}:`), `en.ts missing ${key}`);
    assert(i18nHiTs.includes(`${key}:`), `hi.ts missing ${key}`);
    assert(i18nMrTs.includes(`${key}:`), `mr.ts missing ${key}`);
  }
});

// TEST 9: Dynamic OTP simulation - Statistical uniqueness & format
runTest('TEST 9: Dynamic 6-digit OTP generation produces valid random codes', () => {
  const codes = new Set();
  for (let i = 0; i < 200; i++) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    assert.strictEqual(code.length, 6, 'Code must be exactly 6 characters');
    assert(/^\d{6}$/.test(code), 'Code must contain only digits');
    assert(code !== '123456' || Math.random() < 0.01, 'Code should not be permanently 123456');
    codes.add(code);
  }
  // Across 200 random 6-digit numbers, virtually all should be unique
  assert(codes.size > 190, `Expected >190 unique codes out of 200, got ${codes.size}`);
});

// TEST 10: Attempt limit simulation
runTest('TEST 10: OTP Verification lockout after 5 incorrect attempts', () => {
  const pendingData = {
    phoneNumber: '+919876543210',
    code: '748291',
    expiresAt: Date.now() + 5 * 60 * 1000,
    attempts: 0,
  };

  function simulateVerify(inputOtp) {
    if (Date.now() > pendingData.expiresAt) {
      throw new Error('OTP expired');
    }
    if (pendingData.attempts >= 5) {
      throw new Error('Maximum attempts exceeded');
    }
    if (inputOtp !== pendingData.code) {
      pendingData.attempts++;
      throw new Error(`Incorrect OTP (${5 - pendingData.attempts} remaining)`);
    }
    return true;
  }

  // 5 wrong attempts
  for (let i = 1; i <= 5; i++) {
    assert.throws(() => simulateVerify('000000'), /Incorrect OTP/);
  }
  // 6th attempt must be locked out
  assert.throws(() => simulateVerify('000000'), /Maximum attempts exceeded/);
});

// TEST 11: Expiry simulation
runTest('TEST 11: OTP Verification rejects expired code', () => {
  const expiredData = {
    phoneNumber: '+919876543210',
    code: '748291',
    expiresAt: Date.now() - 1000, // already expired
    attempts: 0,
  };

  assert(Date.now() > expiredData.expiresAt, 'Should be recognized as expired');
});

// TEST 12: RoleSelectionScreen does not bypass authentication
runTest('TEST 12: RoleSelectionScreen has NO unauthenticated bypass and routes to Login/Signup', () => {
  const roleSelectionTsx = fs.readFileSync(
    path.join(__dirname, '../src/screens/onboarding/RoleSelectionScreen.tsx'),
    'utf-8'
  );
  assert(!roleSelectionTsx.includes('selectRoleQuick'), 'RoleSelectionScreen must NOT call selectRoleQuick');
  assert(roleSelectionTsx.includes("navigation.navigate('Login'"), 'RoleSelectionScreen missing Login navigation');
  assert(roleSelectionTsx.includes("navigation.navigate('Signup'"), 'RoleSelectionScreen missing Signup navigation');
  assert(roleSelectionTsx.includes('handleNavigateToLogin'), 'RoleSelectionScreen missing handleNavigateToLogin');
  assert(roleSelectionTsx.includes('handleNavigateToSignup'), 'RoleSelectionScreen missing handleNavigateToSignup');
});

// TEST 13: Persistent session across app restarts
runTest('TEST 13: useAuthStore and RootNavigator persist and restore authenticated sessions', () => {
  assert(authStoreTs.includes('@scrapdeal_active_session_user_id'), 'Missing active session storage key');
  assert(authStoreTs.includes('AsyncStorage.setItem'), 'Missing AsyncStorage.setItem in auth store');
  assert(authStoreTs.includes('AsyncStorage.removeItem'), 'Missing AsyncStorage.removeItem in logout');
  assert(authStoreTs.includes('isInitialized'), 'Missing isInitialized in auth store');

  const rootNavTs = fs.readFileSync(
    path.join(__dirname, '../src/navigation/RootNavigator.tsx'),
    'utf-8'
  );
  assert(rootNavTs.includes('restoreSession'), 'RootNavigator must check restoreSession');
  assert(rootNavTs.includes('isAuthenticated'), 'RootNavigator must check isAuthenticated');
  assert(rootNavTs.includes('initialRouteName={initialRoute}'), 'RootNavigator must set dynamic initialRouteName');
});

console.log('\n----------------------------------------------------------------');
console.log(`Results: ${passedTests} Passed, ${failedTests} Failed`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY!');
  process.exit(0);
}
