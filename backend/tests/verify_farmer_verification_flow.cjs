/**
 * GreenBond - Farmer Land Proof Verification End-to-End Test Suite
 * 
 * Verifies all 8 required test scenarios:
 * Scenario 1: Complete Happy Path (Signup -> Pending -> Admin View & Stream Doc -> Admin Approve -> Active)
 * Scenario 2: Rejection & Re-upload Path (Signup -> Reject with reason -> Pending Farmer sees reason -> Re-uploads -> Pending -> Approve)
 * Scenario 3: Pending Farmer Blocked from Protected Farmer Dashboard Data (403 FARMER_NOT_APPROVED)
 * Scenario 4: Normal Customer USER Blocked from Farmer APIs (403)
 * Scenario 5: Delivery Boy Blocked from Farmer APIs (403)
 * Scenario 6: Normal USER Blocked from Admin Document API (403)
 * Scenario 7: Farmer Privacy / Isolation (Farmer Cannot Access Other Farmer's Document)
 * Scenario 8: Admin Authorized Document Access (200 OK binary stream with correct MIME & disposition)
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

// Sample dummy binary data for testing upload & streaming
const DUMMY_PDF_BUFFER = Buffer.from('%PDF-1.4 sample patta document content for greenbond testing %%EOF');
const DUMMY_JPG_BUFFER = Buffer.from('\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00\xFF\xD9');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        throw new Error(message);
    }
    passedTests++;
    console.log(`✅ PASSED: ${message}`);
}

async function runSuite() {
    console.log('===============================================================');
    console.log('🌱 GREENBOND FARMER LAND PROOF VERIFICATION TEST SUITE');
    console.log('===============================================================\n');

    const timestamp = Date.now();
    const farmer1Mobile = '98' + String(Math.floor(10000000 + Math.random() * 90000000));
    const farmer2Mobile = '97' + String(Math.floor(10000000 + Math.random() * 90000000));
    const farmer3Mobile = '96' + String(Math.floor(10000000 + Math.random() * 90000000));
    const customerMobile = '95' + String(Math.floor(10000000 + Math.random() * 90000000));
    const deliveryMobile = '94' + String(Math.floor(10000000 + Math.random() * 90000000));

    let adminToken = '';
    let farmer1Token = '';
    let farmer1Id = '';
    let farmer2Token = '';
    let farmer2Id = '';
    let farmer3Token = '';
    let farmer3Id = '';
    let customerToken = '';
    let deliveryToken = '';

    // =========================================================================
    // STEP 0: Admin Authentication
    // =========================================================================
    console.log('--- Step 0: Admin Authentication ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'admin@greenbond.com',
            password: 'admin123'
        })
    });
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminData.token, 'Admin logs in successfully');
    assert(adminData.user && adminData.user.role === 'admin', 'Admin user has role="admin"');
    adminToken = adminData.token;

    // =========================================================================
    // TEST 1: Complete Happy Path (Signup with Patta -> Pending -> Admin View -> Admin Approve -> Active)
    // =========================================================================
    console.log('\n--- TEST 1: Happy Path (Signup -> Pending -> Admin Approve) ---');
    const form1 = new FormData();
    form1.append('name', 'Pugazh Farmer One');
    form1.append('mobile', farmer1Mobile);
    form1.append('email', `farmer1_${timestamp}@test.com`);
    form1.append('password', 'farm1234');
    form1.append('landOwnerName', 'Pugazh Arasu');
    form1.append('surveyNumber', '142/3B');
    form1.append('landArea', '5.2 Acres');
    form1.append('village', 'Kaveripattinam');
    form1.append('taluk', 'Pochampalli');
    form1.append('district', 'Krishnagiri');
    form1.append('state', 'Tamil Nadu');
    form1.append('pincode', '635112');
    form1.append('landDocumentType', 'Patta');
    form1.append('landDocumentNumber', 'PATTA-TN-KG-1423B');
    
    // Attach PDF land proof
    const pdfBlob = new Blob([DUMMY_PDF_BUFFER], { type: 'application/pdf' });
    form1.append('landProof', pdfBlob, 'patta_official.pdf');

    const reg1Res = await fetch(`${BASE_URL}/api/auth/register-farmer`, {
        method: 'POST',
        body: form1
    });
    const reg1Data = await reg1Res.json();
    assert(reg1Res.status === 201, 'Farmer 1 registration returned 201 Created');
    assert(reg1Data.farmer && reg1Data.farmer.verificationStatus === 'PENDING', 'Farmer 1 verificationStatus is "PENDING"');
    assert(reg1Data.farmer.farmerStatus === 'PENDING', 'Farmer 1 farmerStatus is "PENDING"');
    assert(reg1Data.farmer.landDocumentType === 'Patta', 'Farmer 1 landDocumentType is "Patta"');
    farmer1Token = reg1Data.token;
    farmer1Id = reg1Data.farmer.id || reg1Data.farmer._id;

    // Verify Farmer 1 can check their own status via /api/farmers/me/status
    const status1Res = await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${farmer1Token}` }
    });
    const status1Data = await status1Res.json();
    assert(status1Res.status === 200, 'Farmer 1 can fetch their status via /api/farmers/me/status');
    assert(status1Data.verificationStatus === 'PENDING', 'Fetched status confirms verificationStatus is PENDING');
    assert(status1Data.hasLandDocument === true, 'hasLandDocument is true');

    // Admin checks pending farmers list
    const adminFarmersRes = await fetch(`${BASE_URL}/api/admin/farmers`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminFarmersData = await adminFarmersRes.json();
    assert(adminFarmersRes.status === 200, 'Admin can fetch /api/admin/farmers');
    const farmersList = Array.isArray(adminFarmersData) ? adminFarmersData : (adminFarmersData.farmers || []);
    const foundF1 = farmersList.find(f => String(f._id || f.id) === String(farmer1Id));
    assert(Boolean(foundF1), 'Admin sees Farmer 1 in the list');
    assert(foundF1.verificationStatus === 'PENDING', 'Admin sees Farmer 1 is PENDING');
    assert(foundF1.landDocumentNumber === 'PATTA-TN-KG-1423B', 'Admin sees correct document number');

    // Admin views document stream
    const adminDocStreamRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmer1Id}/document`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminDocStreamRes.status === 200, 'Admin streams Farmer 1 document with 200 OK');
    const docContentType = adminDocStreamRes.headers.get('content-type');
    assert(docContentType && docContentType.includes('application/pdf'), 'Document streamed with application/pdf Content-Type');
    const streamedBuffer = Buffer.from(await adminDocStreamRes.arrayBuffer());
    assert(streamedBuffer.length === DUMMY_PDF_BUFFER.length, 'Streamed document byte size matches uploaded file exactly');

    // Admin approves Farmer 1
    const approveRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmer1Id}/approve`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        }
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Admin approval returned 200 OK');
    assert(approveData.farmer && approveData.farmer.verificationStatus === 'APPROVED', 'Farmer 1 verificationStatus changed to "APPROVED"');
    assert(approveData.farmer.farmerStatus === 'ACTIVE', 'Farmer 1 farmerStatus changed to "ACTIVE"');

    // Farmer 1 status reflects approval
    const status1AfterRes = await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${farmer1Token}` }
    });
    const status1AfterData = await status1AfterRes.json();
    assert(status1AfterData.verificationStatus === 'APPROVED', 'Farmer 1 status is now APPROVED');
    assert(status1AfterData.farmerStatus === 'ACTIVE', 'Farmer 1 farmerStatus is now ACTIVE');

    // Farmer 1 accesses protected dashboard data API
    const dash1Res = await fetch(`${BASE_URL}/api/farmers/dashboard-data`, {
        headers: { 'Authorization': `Bearer ${farmer1Token}` }
    });
    assert(dash1Res.status === 200, 'Approved Farmer 1 accesses protected farmer dashboard data');

    // =========================================================================
    // TEST 2: Rejection & Re-upload Path (Signup -> Reject -> Reason visible -> Re-upload -> Approve)
    // =========================================================================
    console.log('\n--- TEST 2: Rejection & Re-upload Workflow ---');
    const form2 = new FormData();
    form2.append('name', 'Ramesh Farmer Two');
    form2.append('mobile', farmer2Mobile);
    form2.append('email', `farmer2_${timestamp}@test.com`);
    form2.append('password', 'farm5678');
    form2.append('landOwnerName', 'Ramesh Kumar');
    form2.append('surveyNumber', '88/1');
    form2.append('landArea', '3.0 Acres');
    form2.append('village', 'Morappur');
    form2.append('taluk', 'Harur');
    form2.append('district', 'Dharmapuri');
    form2.append('state', 'Tamil Nadu');
    form2.append('pincode', '635305');
    form2.append('landDocumentType', 'Chitta');
    form2.append('landDocumentNumber', 'CHITTA-DHP-881');
    
    // Attach initial image
    const jpgBlob1 = new Blob([DUMMY_JPG_BUFFER], { type: 'image/jpeg' });
    form2.append('landProof', jpgBlob1, 'chitta_blurry.jpg');

    const reg2Res = await fetch(`${BASE_URL}/api/auth/register-farmer`, {
        method: 'POST',
        body: form2
    });
    const reg2Data = await reg2Res.json();
    assert(reg2Res.status === 201, 'Farmer 2 registered with status PENDING');
    farmer2Token = reg2Data.token;
    farmer2Id = reg2Data.farmer.id || reg2Data.farmer._id;

    // Admin rejects Farmer 2 with a specific reason
    const rejectionReason = 'Uploaded Chitta document is blurry and survey number 88/1 is not clearly legible. Please upload a high-resolution scan.';
    const rejectRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmer2Id}/reject`, {
        method: 'PUT',
        headers: { 
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.status === 200, 'Admin rejection returned 200 OK');
    assert(rejectData.farmer.verificationStatus === 'REJECTED', 'Farmer 2 verificationStatus is "REJECTED"');
    assert(rejectData.farmer.farmerStatus === 'INACTIVE', 'Farmer 2 farmerStatus is "INACTIVE"');
    assert(rejectData.farmer.landDocumentRejectionReason === rejectionReason, 'Rejection reason saved correctly');

    // Farmer 2 calls /api/farmers/me/status and verifies rejection reason
    const status2Res = await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${farmer2Token}` }
    });
    const status2Data = await status2Res.json();
    assert(status2Data.verificationStatus === 'REJECTED', 'Farmer 2 status is REJECTED');
    assert(status2Data.landDocumentRejectionReason === rejectionReason, 'Farmer 2 sees exact rejection reason from admin');

    // Rejected Farmer 2 tries to access dashboard-data -> Blocked (403)
    const rejectDashRes = await fetch(`${BASE_URL}/api/farmers/dashboard-data`, {
        headers: { 'Authorization': `Bearer ${farmer2Token}` }
    });
    assert(rejectDashRes.status === 403, 'Rejected Farmer 2 is strictly BLOCKED from dashboard data (403)');
    const rejectDashData = await rejectDashRes.json();
    assert(rejectDashData.code === 'FARMER_NOT_APPROVED', 'Rejected Farmer receives FARMER_NOT_APPROVED code');

    // Farmer 2 re-uploads proof
    console.log('Farmer 2 re-uploading corrected document...');
    const reuploadForm = new FormData();
    reuploadForm.append('landDocumentType', 'Chitta');
    reuploadForm.append('landDocumentNumber', 'CHITTA-DHP-881-HD');
    const correctedJpgBlob = new Blob([Buffer.from(DUMMY_JPG_BUFFER.toString() + ' hd_correction')], { type: 'image/jpeg' });
    reuploadForm.append('landProof', correctedJpgBlob, 'chitta_crystal_clear.jpg');

    const reuploadRes = await fetch(`${BASE_URL}/api/farmers/reupload-proof`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${farmer2Token}` },
        body: reuploadForm
    });
    const reuploadData = await reuploadRes.json();
    assert(reuploadRes.status === 200, 'Farmer 2 re-upload returned 200 OK');
    assert(reuploadData.verificationStatus === 'PENDING', 'Status reset to PENDING after re-upload');

    // Farmer 2 checks status: rejection reason is cleared, status is PENDING
    const status2AfterReupload = await (await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${farmer2Token}` }
    })).json();
    assert(status2AfterReupload.verificationStatus === 'PENDING', 'Farmer 2 status is now PENDING');
    assert(!status2AfterReupload.landDocumentRejectionReason, 'Rejection reason is cleared after re-upload');

    // Admin approves re-uploaded Farmer 2
    const approveF2Res = await fetch(`${BASE_URL}/api/admin/farmers/${farmer2Id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(approveF2Res.status === 200, 'Admin approves Farmer 2 after re-upload');
    const f2Final = await (await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${farmer2Token}` }
    })).json();
    assert(f2Final.verificationStatus === 'APPROVED' && f2Final.farmerStatus === 'ACTIVE', 'Farmer 2 is now APPROVED & ACTIVE');

    // =========================================================================
    // TEST 3: Pending Farmer Blocked from Protected Dashboard API
    // =========================================================================
    console.log('\n--- TEST 3: Pending Farmer Blocked from Dashboard API ---');
    const form3 = new FormData();
    form3.append('name', 'Suresh Farmer Three');
    form3.append('mobile', farmer3Mobile);
    form3.append('email', `farmer3_${timestamp}@test.com`);
    form3.append('password', 'farm9999');
    form3.append('landOwnerName', 'Suresh');
    form3.append('surveyNumber', '210/5');
    form3.append('landArea', '2.0 Acres');
    form3.append('village', 'Pennagaram');
    form3.append('taluk', 'Pennagaram');
    form3.append('district', 'Dharmapuri');
    form3.append('state', 'Tamil Nadu');
    form3.append('pincode', '636810');
    form3.append('landDocumentType', 'Other');
    form3.append('landDocumentNumber', 'DOC-2105');
    form3.append('landProof', new Blob([DUMMY_PDF_BUFFER], { type: 'application/pdf' }), 'tax_receipt.pdf');

    const reg3Res = await fetch(`${BASE_URL}/api/auth/register-farmer`, { method: 'POST', body: form3 });
    const reg3Data = await reg3Res.json();
    farmer3Token = reg3Data.token;
    farmer3Id = reg3Data.farmer.id || reg3Data.farmer._id;

    // Pending farmer attempts to call protected dashboard-data
    const pendingDashRes = await fetch(`${BASE_URL}/api/farmers/dashboard-data`, {
        headers: { 'Authorization': `Bearer ${farmer3Token}` }
    });
    assert(pendingDashRes.status === 403, 'Pending farmer is BLOCKED with 403 from dashboard-data');
    const pendingDashData = await pendingDashRes.json();
    assert(pendingDashData.code === 'FARMER_NOT_APPROVED', 'Response code is FARMER_NOT_APPROVED');

    // =========================================================================
    // TEST 4: Normal Customer USER Blocked from Farmer APIs
    // =========================================================================
    console.log('\n--- TEST 4: Normal Customer USER Blocked from Farmer APIs ---');
    const custRes = await fetch(`${BASE_URL}/api/auth/register-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Regular Customer',
            email: `customer_${timestamp}@test.com`,
            mobile: customerMobile,
            password: 'Password@123',
            confirmPassword: 'Password@123'
        })
    });
    const custData = await custRes.json();
    assert(custRes.status === 201, 'Customer registered successfully');
    customerToken = custData.token;

    const custTryFarmerRes = await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(custTryFarmerRes.status === 403, 'Customer calling /api/farmers/me/status blocked with 403');

    const custTryDashRes = await fetch(`${BASE_URL}/api/farmers/dashboard-data`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(custTryDashRes.status === 403, 'Customer calling /api/farmers/dashboard-data blocked with 403');

    // =========================================================================
    // TEST 5: Delivery Boy Blocked from Farmer APIs
    // =========================================================================
    console.log('\n--- TEST 5: Delivery Boy Blocked from Farmer APIs ---');
    const delivRes = await fetch(`${BASE_URL}/api/auth/register-delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Speedy Delivery',
            email: `delivery_${timestamp}@test.com`,
            mobile: deliveryMobile,
            password: 'Password@123',
            confirmPassword: 'Password@123'
        })
    });
    const delivData = await delivRes.json();
    assert(delivRes.status === 201, 'Delivery Partner registered successfully');
    deliveryToken = delivData.token;

    const delivTryFarmerRes = await fetch(`${BASE_URL}/api/farmers/me/status`, {
        headers: { 'Authorization': `Bearer ${deliveryToken}` }
    });
    assert(delivTryFarmerRes.status === 403, 'Delivery Partner calling /api/farmers/me/status blocked with 403');

    // =========================================================================
    // TEST 6: Normal Customer USER Blocked from Document API
    // =========================================================================
    console.log('\n--- TEST 6: Normal USER Blocked from Admin Document API ---');
    const custTryDocRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmer1Id}/document`, {
        headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(custTryDocRes.status === 403, 'Normal USER calling admin document stream blocked with 403');

    // =========================================================================
    // TEST 7: Farmer Privacy / Isolation (Farmer Cannot Access Other Farmer's Document)
    // =========================================================================
    console.log('\n--- TEST 7: Farmer Isolation / Document Privacy ---');
    // Farmer 2 attempts to call admin document endpoint for Farmer 1
    const f2TryF1DocRes = await fetch(`${BASE_URL}/api/admin/farmers/${farmer1Id}/document`, {
        headers: { 'Authorization': `Bearer ${farmer2Token}` }
    });
    assert(f2TryF1DocRes.status === 403, 'Farmer 2 cannot call admin document endpoint for Farmer 1 (403)');

    // Farmer 2 calls own document endpoint
    const f2OwnDocRes = await fetch(`${BASE_URL}/api/farmers/me/document`, {
        headers: { 'Authorization': `Bearer ${farmer2Token}` }
    });
    assert(f2OwnDocRes.status === 200, 'Farmer 2 can access own document via /api/farmers/me/document');
    const f2DocHeader = f2OwnDocRes.headers.get('content-disposition');
    assert(f2DocHeader && f2DocHeader.includes('chitta_crystal_clear.jpg'), 'Farmer 2 receives only their own document');

    // =========================================================================
    // TEST 8: Admin Authorized Document Access
    // =========================================================================
    console.log('\n--- TEST 8: Admin Document Access ---');
    const adminDocF3Res = await fetch(`${BASE_URL}/api/admin/farmers/${farmer3Id}/document`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(adminDocF3Res.status === 200, 'Admin streams Farmer 3 document with 200 OK');
    const f3Disposition = adminDocF3Res.headers.get('content-disposition');
    assert(f3Disposition && f3Disposition.includes('inline'), 'Admin document disposition is inline for modal viewing');

    // Check invalid farmer ID handling
    const invalidDocRes = await fetch(`${BASE_URL}/api/admin/farmers/000000000000000000000000/document`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    assert(invalidDocRes.status === 404, 'Admin querying non-existent farmer document returns 404');

    console.log('\n===============================================================');
    console.log(`🎉 ALL ${passedTests} / ${totalTests} TESTS PASSED SUCCESSFULLY!`);
    console.log('===============================================================\n');
}

runSuite().catch(err => {
    console.error('\n❌ Test Suite Aborted due to error:', err);
    process.exit(1);
});
