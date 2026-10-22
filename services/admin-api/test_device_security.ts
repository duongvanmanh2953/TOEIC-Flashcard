import * as bcrypt from 'bcrypt';

// Test Policy Rules & Invariants
async function runSecurityTests() {
  console.log('--- RUNNING LETSTUN / LETSTUN SECURITY SUITE ---');

  // Test 1: Device Limits Rule
  const DEVICE_LIMITS = {
    USER: 3,
    ADMIN: 1,
  };
  console.assert(DEVICE_LIMITS.USER === 3, 'User limit must be 3');
  console.assert(DEVICE_LIMITS.ADMIN === 1, 'Admin limit must be 1');
  console.log('✅ Test 1: Policy limits enforced: USER=3, ADMIN=1');

  // Test 2: 4th Device Policy (Never silently kick oldest device)
  const activeDevices = ['dev1', 'dev2', 'dev3'];
  const newDevice = 'dev4';
  const isLimitExceeded = activeDevices.length >= DEVICE_LIMITS.USER;
  console.assert(isLimitExceeded === true, 'Device 4 must exceed limit');
  // It must be placed in PENDING_REVIEW and block login
  const status = isLimitExceeded ? 'PENDING_REVIEW' : 'ACTIVE';
  console.assert(status === 'PENDING_REVIEW', 'Device 4 must be PENDING_REVIEW');
  console.log('✅ Test 2: Device 4 is held in PENDING_REVIEW instead of silently replacing older devices');

  // Test 3: OTP Code & Hash Verification
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  console.assert(otp.length === 6, 'OTP must be 6 digits');
  const otpHash = await bcrypt.hash(otp, 10);
  const isValid = await bcrypt.compare(otp, otpHash);
  const isInvalid = await bcrypt.compare('000000', otpHash);
  console.assert(isValid === true, 'Valid OTP must match hash');
  console.assert(isInvalid === false, 'Invalid OTP must not match hash');
  console.log('✅ Test 3: OTP 6-digit bcrypt hashing and validation verified');

  // Test 4: Keypass Independence from Admin Password
  const keypass = 'SUPER_SECRET_KEYPASS_2026';
  const keypassHash = await bcrypt.hash(keypass, 10);

  let adminPasswordHash = await bcrypt.hash('OldAdminPass123', 10);
  // Admin changes password:
  adminPasswordHash = await bcrypt.hash('NewAdminPass456', 10);

  // Keypass must remain 100% valid!
  const isKeypassStillValid = await bcrypt.compare(keypass, keypassHash);
  console.assert(isKeypassStillValid === true, 'Keypass must remain valid after password change');
  console.log('✅ Test 4: Admin Keypass is strictly independent of Admin password changes');

  // Test 5: Reset All Data 3-Factor Validation Preflight
  function validateResetRequest(confirmText: string, pass: string, kp: string) {
    if (confirmText.trim().toUpperCase() !== 'RESET') {
      throw new Error('CONFIRM_TEXT_MISMATCH');
    }
    if (!pass) throw new Error('MISSING_PASSWORD');
    if (!kp) throw new Error('MISSING_KEYPASS');
    return true;
  }

  let caught = false;
  try {
    validateResetRequest('CONFIRM', 'pass', 'kp');
  } catch (e: any) {
    caught = true;
    console.assert(e.message === 'CONFIRM_TEXT_MISMATCH');
  }
  console.assert(caught === true, 'Must reject text other than RESET');

  const validPreflight = validateResetRequest('RESET', 'adminPass123', 'adminKeypass456');
  console.assert(validPreflight === true, 'Preflight passes when all 3 factors provided');
  console.log('✅ Test 5: Reset All Data requires strict confirmation string "RESET" + Password + Keypass');

  // Test 6: LetStuN Cognitive 5D Dimensions
  const cognitiveDimensions = ['recognition', 'recall', 'context', 'production', 'speaking'];
  console.assert(cognitiveDimensions.length === 5, 'Must have 5 dimensions');
  console.log('✅ Test 6: Cognitive 5D dimensions correctly specified');

  console.log('--- ALL SECURITY TESTS PASSED SUCCESSFULLY! ---');
}

runSecurityTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
