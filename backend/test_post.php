<?php
$data = [
    'grade' => '1',
    'first_name' => 'Test',
    'father_name' => 'Test',
    'grandfather_name' => 'Test',
    'family_name' => 'Test',
    'national_id' => '30501010101010',
    'nationality' => 'egyptian',
    'religion' => 'muslim',
    'phone' => '01012345678',
    'second_language' => 'french',
    'address_village' => 'Village',
    'address_center' => 'Center',
    'address_gov' => 'Gov',
    'prep_total' => '280',
    'prep_school' => 'School',
    'prep_seat_no' => '1234',
    
    'parent_first_name' => 'PFirst',
    'parent_father_name' => 'PFather',
    'parent_grandfather_name' => 'PGrand',
    'parent_family_name' => 'PFamily',
    'parent_job' => 'PJob',
    'parent_phone' => '01012345679',

    'mother_first_name' => 'MFirst',
    'mother_father_name' => 'MFather',
    'mother_grandfather_name' => 'MGrand',
    'mother_family_name' => 'MFamily',
    'mother_job' => 'MJob',
    'mother_phone' => '01012345670',

    'contact_first_name' => 'CFirst',
    'contact_father_name' => 'CFather',
    'contact_grandfather_name' => 'CGrand',
    'contact_family_name' => 'CFamily',
    'contact_relation' => 'Uncle',
    'contact_phone' => '01012345671',

    'main_contact_phone' => '01012345679',
];

$ch = curl_init('http://localhost:8001/api/register');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'Accept: application/json'
]);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpcode\n";
echo "Response: $response\n";
