eSIM Access API
Partner API
Deliver eSIM data plan packages via the eSIM Access HTTP API. Step by step overview.

Quick Start
1. Create an account at eSIM Access
2. Deposit funds for testing and refunding
3. Copy your AccessCode
4. Add your AccessCode below and run in your terminal or powershell to make your first API call

bash
curl --location --request POST 'https://api.esimaccess.com/api/v1/open/balance/query'
--header 'RT-AccessCode: YOUR_ACCCESS_CODE'
--data ''

powershell
curl -Uri "https://api.esimaccess.com/api/v1/open/balance/query" `
-Method POST `
-Headers @{"RT-AccessCode"="YOUR_ACCESS_CODE"} `
-Body ""

Version - V1
Version 1 - OCT 11, 2022 - Initial Release
Version 1.1 - JUN 6, 2023 - Updates:
Single Profile ordering changed to batch Profile ordering [via Order Profiles request]
Offline post-paying changed to online pre-paying [via Order Profiles request]
esim/list endpoint removed, status function found in esim/query
Cancel, Suspend, Unsuspend and Revoke functions added
Country filter added to Query All Data Packages
Webook for order status checking added
Version 1.2 - JUL 26, 2023 - Updates:
Added Top Up endpoint for adding data to existing eSIM profiles
Query available Top Up plans with iccid or packageCode
Price and amount optional when ordering a profile

Version 1.3 - DEC 12, 2023 - Updates:
Adds slug as an alias to package code
Adds additional package data like speed , network , and favorite
Version 1.4 Mar 12, 2024 - Updates:
Add SMS send to iccid ability
Adds ability to write webhooks
Version 1.5 July 28, 2024 - Updates:
Adds daypass plans with periodNum parameter in Order Profiles
Adds rate limit of 8 requests per second
Version 1.6 Dec 20, 2024 - Updates:
Adds fields supportTopUpType and ipExport
Update Mar 8, 2025
Adds additional webhook for low balance now at 25% and 10% remaining
Adds balance check endpoint with last updated date
Update Mar 19, 2025
Adds two new enpoints for balance check and current regions
Update May 28, 2025
Add new webhooks - SMDP_EVENT which give SM-DP+ server events
Update July 24, 2025
Top Up packages can be added after esim is created.
Update Dec 2, 2025
Adds datatype search fuppolicy result when viewing data packages.

Environments and Endpoints
Sandbox:
There is no Sandbox environment. Cancel eSIM orders as needed in our live environment. Request funds for testing.

Production:
https://api.esimaccess.com
Image assets:
https://p.qrsim.net/

Authentication

Requst your API keys in your online account.

Standards
Time codes are presented in UTC. Country codes use Alpha-2 ISO. Data values are in Bytes.

Status
Server status tracked via postman monitors.

Rate Limit
8 API request per second are allowed.

Error Codes
Code

Message

000001

Server error

000101

Request header (mandatory) is null

000102

Wrong request header format

000103

This https request method (get/post ) is not
supported

000104

Request in invalid JSON format

000105

Request parameters (mandatory) are not contained

000106

Request parameter (mandatory) is null

000107

The length of the request parameter does not meet
the requirement.

101001

The timestamp of the request has expired.

101002

This IP is in the blocklist.

101003

Request signature mismatch.

200002

This operation is not allowed due to the order status.

200005

Package price error. Check price.

200006

Total order price amount is wrong. Check prices.

200007

Insufficient account balance

200008

Order parameters error, please contact customer
service.

​200009

Abnormal order status

​200010

Profile is being downloaded for the order.

200011

Insufficient available Profiles for the package, please
contact the customer service.

310201

The bundle.code does not exist.

310211

The data_plan_location.id does not exist.

310221

The currencyId does not exist.

310231

The carrierId does not exist.

310241

The packageCode does not exist.

310243

The package does not exist

AUTHORIZATION API Key
Key

RT-AccessCode

Value

API
Authentication methods
Key in Header
Use the AccessCode as the API key in header authentication method.

HMAC Signature
HMAC-SHA256 signature calculation (hash-based message authentication code) uses a secret key to generate a
unique signature for a message. The signature is then used to verify the authenticity of the message.

Request Header Authenticaion

Name

Description

RT-AccessCode

Access Key found in your account, used in signData

RT-RequestID

Request ID with the uuid.v4() method generates a
new random UUID (Universally Unique Identifier).

RT-Signature

Signature (HexString) of the request

RT-Timestamp

Request sending timestamp (in milliseconds) as a
string

SecretKey

Used in the signature request, found in your account.

Calculation by HMAC-SHA256:
signData = Timestamp + RequestID + AccessCode + RequestBody
signature = HMACSHA256(signData, SecretCode)

java
// Concatenate RT-Timestamp, RT-RequestID, RT-AccessCode, and requestBody into one string.
// This string, signStr, will be used as the data to hash in the HMAC-SHA256 function.
String signStr = RT-Timestamp + RT-RequestID + RT-AccessCode + requestBody
// Generate an HMAC-SHA256 hash of the signStr using the secretKey.
// The resulting hash is converted to all lowercase characters for standardization purposes
sign = HMACSha256(signStr, secretKey).toLowerCase();

Signature Example

Plain Text
Timestamp=1628670421
RequestID=4ce9d9cdac9e4e17b3a2c66c358c1ce2
AccessCode=11111
SecretKey=1111
RequestBody={"imsi":"326543826"}
signStr=16286704214ce9d9cdac9e4e17b3a2c66c358c1ce211111{"imsi":"326543826"}
Signature=7EB765E27DF5373DEA2DBC8C41A7D9557743E46C8054750F3D851B3FD01D0835

AUTHORIZATION API Key
This folder is using API Key from collection eSIM Access API

POST

Get All Data Packages

https://api.esimaccess.com/api/v1/open/package/list

Request a list of all the available data packages offered. Optionally filter by country or region.

Additionaly request all of the Top Up plans available for a specific packageCode , slug or ICCID . Specific top
ups work with specific plans. In general, countries can be reloaded with same country top up and region with same
region top up.

Request Parameters
Name

Type

MOC

Description

Example

locationCode

String

optional

Filter by Alpha-2

JP

ISO Country

!GL

Code

!RG

!RG = Regional
!GL = Global
type

String

optional

BASE - Default

BASE

product list

TOPUP

TOPUP - Top up
product list
packageCode

String

optional

Used with

JC016

TOPUP to view
top up package
for a
packageCode
slug

String

optional

slug is alias

AU_1_7

of packageCod
e
iccid

String

optional

Include iccid

4858498474737

with TOPUP to

2838

see available

Reponse Parameters
Name

Type

MOC

Description

Example

success

String

mandatory

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed.
errorMessage

String

optional

Error code
explanation

obj

Object

optional

null : failed.
Success
includes:
packageList

null

Domain

Type

MOC

Description

packageList

List

mandatory

Available data

Example

packages,
including:
packageCode
name

price

currencyCode
volume
unusedValidTi
me

duration

durationUnit
location
description
activeType
packageCode

String

mandatory

Package code

JC016

slug

String

mandatory

Package alias

AU_1_7

name

String

mandatory

Package name

Asia 11
countries 1GB
30 Days

price

Integer

mandatory

Package price,

10000

value * 10,000

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"locationCode": "",
"type":"TOPUP",
"slug":"VN_0.1_7",
"packageCode":"",
"iccid":""
}

POST

Order Profiles

https://api.esimaccess.com/api/v1/open/esim/order

Order profiles individualy or in batch. After successful ordering, the SM-DP+ server will return the OrderNo and

allocate profiles asynchronously for the order.

To make an order
1. Provide a uniqe transactionId for each order. Duplicate transactionId will be identified as the same
request.
2. Provide the packageCode or slug of the data package(s) you will order.
3. Provide the count for each package needed.
4. Optional price check: Provide the price and multiply with count for the total cost to provide the amount .
5. Optional period: For daily plans include the periodNum corresponding to the number of days of the plan.
A successful order will generate an orderNo . Query all the allocated profiles in the endpoint
/api/v1/open/esim/query

Request Parameters
Name

Type

MOC

Description

Example

transactionI

String

mandatory

User generated

ABC-210-

unique

2s7Fr

d

transaction ID.
Max 50 chars,
utf8mb4. If the
request is retired,
it needs to be
contained;
otherwise, a new
transaction will
be created.
amount

Long

optional

Total order

20000

amount
packageInfoLi

List

mandatory

st

packageCode
or slug ,
count ,
price

Domain

Type

MOC

Description

Example

packageCode

String

mandatory

Order with

AU_1_7

slug or

JC016

packageCode
(prefer slug)a
count

Integer

mandatory

Number of

2

packages to be
ordered
price

Integer

optional

Package price,

10000

value * 10,000
(10000 = $1.00)
periodNum

Integer

optional

Days of a daily
plan. From 1-365.

Response Parameters

7

Name

Type

MOC

Description

Example

success

String

mandatory

true : success

true

false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed.
errorMessage

String

optional

Error code

null

explanation
obj

Object

optional

Includes:
orderNo

Domain

Type

MOC

Description

Example

orderNo

String

mandatory

Order number

B221020100753
11

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"transactionId":"your_txn_id",
"amount":15000,
"packageInfoList": [{
"packageCode":"7aa948d363",
"count":1,
"price":15000
}]
}

POST

Query All Allocated Profiles

https://api.esimaccess.com/api/v1/open/esim/query

Query all eSIM profiles for both new eSIMs, and in use eSIMs.

Get New Orders
Query by orderNo or startTime and endTime range with paging options.

Use orderNo to request newly orderd eSIM profiles. The response will return the eSIM payload after all the allocated
profiles are asynchronously allocated by the server. Expect wait times of up to

30 seconds. You can order up to 30

eSIMs in one batch and all profiles will be returnd with orderNo results.
If the profiles are not yet ready for download, the error will be returned (error code will be 200010 , meaning SM-DP+
is still allocating profiles for the order).
Use the webhook notification "notifyType":"ORDER_STATUS" to inform your first get eSIM request.
ORDER_STATUS webhook will trigger when the eSIM profiles have been created and ready for retrival.

Get Status of Existing Orders
Use esimTranNo , orderNo , or iccid to request the status of an eSIM including it's current orderUsage and
eSIMStatus . Or use startTime and endTime range. esimTranNo and iccid will return a
orderNo will return the

batch order of eSIMs.

single eSIM, while

Important Note: The value of orderUsage is updated within 2-3 hours after eSIM is in use.
Note: iccids are resued, thus the suggested method of eSIM status check is via esimTranNo .
Note: Rate limiting limits to 8 requests per second.

Understanding eSIM Profile Status
Results of several paramaters can identify the current state of any eSIM profile. For example:
eSIM Status

smdpStatus

esimStatus

orderUsage

eid

New

RELEASED

GOT_RESOURCE

0

""

Onboard

ENABLED

IN_USE

0

"890…222"

IN_USE

123

"890…222"

USED_UP

999

"890…222"

USED_UP

999

"890…222"

GOT_RESOURCE
In Use

ENABLED
DISABLED

Depleted

ENABLED
DISABLED

Deleted

DELETED

IN_USE

Request Parameters

Name

Type

MOC

Description

orderNo

String

optional

Order number

Example
B221020638192
4

iccid

String

optional

eSIM ICCID

8985224628000
1113119

startTime

String

optional

Starting time

2010-06-

(ISO UTC time)

30T01:20+00:0
0

endTime

String

optional

End time (ISO

2010-06-

UTC time)

30T02:20+00:0
0

pager

PageParam

mandatory

Page parameters:
pageSize
pageNum

Domain

Type

MOC

Description

Example

pageSize

Integer

mandatory

Page size, value

10

range: [5, 500]
pageNum

Integer

mandatory

Page number,

1

value range: [1,
10000]

Response Parameters
Name

Type

MOC

Description

Example

success

String

mandatory

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed
errorMessage

String

optional

Explanation of
the error code

obj

Object

optional

Includes:
esimList
pager

null

Domain

Type

MOC

Description

pager

PageParam

mandatory

Includes:

Example

pageSize
pageNum
esimList

List

mandatory

List of eSIM
Profiles,
including:
esimTranNo
orderNo
imsi

iccid

ac
qrCodeUrl
smdpStatus
eid
activeType
expiredTime
totalVolume
totalDuratio
n
durationUnit
orderUsage
esimStatus
packageList
PageParam

Type

MOC

Description

Example

Integer

mandatory

Page size, range:

10

Domain
pageSize

[5, 500]
pageNum

Integer

mandatory

Page number,

1

value range: [1,
10000]
total

Long

mandatory

Total number of
Profiles

120

eSIM Domain

Type

MOC

Description

esimTranNo

String

mandatory

eSIM transaction

2210270638191

number

2

Order number

B221027063819

orderNo

String

mandatory

Example

24
imsi

String

optional

IMSI

4540061098465
71

iccid

String

optional

ICCID

8985224528000
0942210

msisdn

String

optional

MSISDN

xxxxx

smsStatus

Integer

mandatory

0 Does not

0

support SMS 1
Can accept SMS
sent by mobile
phones and API
2 Only SMS
sent by API is
acceptable.
dataType

Integer

mandatory

1 .Data in Total

1

2 .Daily Limit
eSIM Domain

Type

MOC

Description

Example

packageCode

String

mandatory

Package ID

CKH179

duration

Integer

mandatory

Valid period of

7

the order
volume

Long

mandatory

Data volume (in

1073741824

bytes) in the
order
locationCode

String

mandatory

Country code of
plan

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"orderNo":"B25080914060004",
"iccid":"",
"pager":{

JP

pager :{
"pageNum":1,
"pageSize":50
}
}

POST

Cancel Profile

https://api.esimaccess.com/api/v1/open/esim/cancel

Cancel an inactive, unused eSIM profile.
The eSIM price is refunded to your balance.
This operation is available when esimStatus is GOT_RESOURCE and smdpStatus is RELEASED meaning the
eSIM was created, but not installed on a device.
Cancel endpoint not available once user has used data with the eSIM.
It is reccomended to use the esimTranNo when making a cancel request.

Use the Cancel Profile endpoint to make refunds, test eSIM purchases and return the value of unused eSIM to your
account balance.

Request Parameters
Name

Type

MOC

Description

Example

iccid

String

optional

eSIM ICCID

8985224628000
1113119

esimTranNo

String

optional

get from "Query

2411131954210

All Allocated

1

Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.

Response Parameters

Name

Type

MOC

success

String

mandatory

Description

Example

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed
errorMessage

String

optional

Explanation of

null

the error code
obj

Object

optional

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"esimTranNo": "23120118156818"
}

POST

Suspend Profile

https://api.esimaccess.com/api/v1/open/esim/suspend

Request to suspend or pause data service to an esim profile.

Request Parameters

Includes

{}

Name

Type

MOC

Description

iccid

String

optional

eSIM ICCID

Example
8985224628000
1113119

esimTranNo

String

optional

get from "Query

2411131954210

All Allocated

1

Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.

Response Parameters
Name

Type

MOC

success

String

mandatory

Description

Example

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed
errorMessage

String

optional

Explanation of

null

the error code
obj

Object

optional

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"iccid":"89852245280001138065"
}

POST

Unsuspend Profile

htt

i

//

i

/

i/ 1/

/

i /

d

Includes

{}

https://api.esimaccess.com/api/v1/open/esim/unsuspend

Request to unsuspend or reactivate data service to an esim profile.

Request Parameters
Name

Type

MOC

Description

Example

iccid

String

optional

eSIM ICCID

8985224628000
1113119

esimTranNo

String

optional

get from "Query

2411131954210

All Allocated

1

Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.

Response Parameters
Name

Type

MOC

Description

Example

success

String

mandatory

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed
errorMessage

String

optional

Explanation of

null

the error code
obj

Object

optional

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"iccid":"89852245280001138065"
}

Includes

{}

POST

Revoke Profile

https://api.esimaccess.com/api/v1/open/esim/revoke

Request to close and remove an active eSIM and data plan. Non-refundable.

Request Parameters
Name

Type

MOC

Description

Example

iccid

String

optional

eSIM ICCID

8985224628000
1113119

esimTranNo

String

optional

get from "Query

2411131954210

All Allocated

1

Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.

Response Parameters
Name

Type

MOC

Description

Example

success

String

mandatory

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed
errorMessage

String

optional

Explanation of

null

the error code
obj

Object

optional

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"iccid":"89852245280001138065"
}

Includes

{}

}

POST

Balance Query

https://api.esimaccess.com/api/v1/open/balance/query

Query the balance of a merchant account. Balance is used when ordering data profiles.

Request Parameters
None.

Reponse Parameters
Name

Type

MOC

Description

Example

success

String

mandatory

true :

true

succeeded
false : failed
errorCode

String

optional

null or 0

null

when successful.
Error code when
failed.
errorMessage

String

optional

Explanation of

null

the error code
obj

Object

optional

Includes:
balance

Domain

Type

MOC

Description

Example

balance

Long

mandatory

Merchant

100000

balance,
expressed
*10000 (100000
= $10.00)

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

POST

Top Up

https://api.esimaccess.com/api/v1/open/esim/topup

Before making a top up, it is reccomended to query the available top up plans (Get All Data Packages endpoint) for a
specific iccid , esimTranNo or packageCode first. This will give you available top up packages specific to this
eSIM. Learn more about top ups.

The top up endpoint allows an existing installed eSIM to be loaded with a new plan. To top up the plan, you need its
ICCID or esimTranNo and the compatible top up data plan packageCode .
Top ups can be requested while the eSIM is in New, In Use or Depleted status, but not after eSIM expiry.

Request Parameters
Name

Type

MOC

Description

Example

iccid

String

optional

eSIM ICCID

8985224628000

(depreciated, use

1113119

esimTranNo )
esimTranNo

String

optional

get from "Query

2411131954210

All Allocated

1

Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
packageCode

String

required

Use a recharge

TOPUP_SM001

packageCode

AU_1_7

starting with
"TOPUP_" or use
slug Learn
more
amount

String

optional

Price of package,

10000

if used will be
Respone Parameters
obj

Type

MOC

Description

Example

transactionI

String

required

Transaction ID

TXN-123

d
iccid

expiredTime

returned
String

Long

required

required

ICCID of the

8985224528000

eSIM

1354019

New date of

2023-08-

pakcage expiry

17T17:01:37+0
000

totalVolume

Long

required

New voulme of

4294967296

data
totalDuratio

Integer

required

n
orderUsage

New duration in

28

days
Long

required

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Total data usage

207239584

Body raw (json)

json
{
"esimTranNo":"",
"iccid":"89852000263213655345",
"packageCode":"TOPUP_JC172",
"transactionId": "1747191693771_topup_partner7"
}

POST

Set Webhook

https://api.esimaccess.com/api/v1/open/webhook/save

Set or update your webhook URL via an API call. You can find the result in your console account here.
You can also view the currently set webhook with the following endpoint:
/api/v1/open/webhook/query

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{"webhook":"https://webhook.endpoint.site/unique-webhook"}

POST

Send SMS

https://api.esimaccess.com/api/v1/open/esim/sendSms

This endpoint is used to send SMS to an eSIM via iccid or esimTranNo . Supported by some networks. Only
installed eSIMs that supports receiving SMS will work.
The smsStatus parameter in the /order and /package endpoints indicates whether the eSIM supports receiving
SMS ( "smsStatus": 1 or 2 ) . There is currently no cost for SMS delivery.

Request Parameters

Name

Type

MOC

Description

iccid

String

optional

eSIM ICCID

Example
8985224628000
1113119

esimTranNo

optional

get from "Query

2411131954210

All Allocated

1

Profiles"
use "iccid" or
"esimTranNo",
can't be blank at
the same time
recommended.
message

String(500)

required

SMS message,

"Thank you for

up to 500

using our eSIM

characters.

service"

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"esimTranNo":"23072017992029",
"message":"Your Message!"
}

POST

Usage Check

https://api.esimaccess.com/api/v1/open/esim/usage/query

Check the data usage of up to 10 eSIMs via their esimTranNo . Returns the amout of dataUsage , the totalData
in the plan, and the lastUpdateTime timestamp of the most recent data used value update.

Important Note: Data usage is updated every 2-3 hours and is not real time.

Field

Type

Description

Example

esimTranNo

String

eSIM transaction

23072017992029

number
dataUsage

Long

Data usage in Bytes

1453344832

totalData

Long

Total data in Bytes

5368709120

lastUpdateTime

String

The timestamp for the

2025-03-

last call record update.

19T18:00:00+0000

For file-based records,
this is the last full hour
of settlement; for
carrier data usage
notifications, it is the
settlement time
recorded in the
notification; for the
carrier’s real-time call
record API, it is the
time when the API was
called.

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{
"esimTranNoList": ["25030303480009"]
}

POST

Supported Regions

https://api.esimaccess.com/api/v1/open/location/list

Check our currently supported countries and plan codes.

Field

Type

Description

Example

code

String

Region code

ES

name

String

Region name

Spain

NA-3
North

America
type

Integer

Region type: 1 for

1

single-country, 2 for
multi-country
subLocation

List

Sub-regions (exists
only when type = 2)

Each SubLocation object contains:
Field

Type

Description

code

String

Region code

name

String

Region name

Example

AUTHORIZATION API Key
This request is using API Key from collection eSIM Access API

Body raw (json)

json
{}

Webhooks
Endpoint Setup
Adding your webhook the first time will trigger a test webhook send. If you have a correctly working endpoint, you will
receive an CHECK_HEALTH event. If our test send fails, your endpoint cannot be saved. To check a valid endpoint try
https://webhook.site/
{"notifyType":"CHECK_HEALTH","content":{"orderNo":"1234567890","orderStatus":"Test"}} **
Set your webhook URL to receive POST requests** in your account.
The notifications contain a notifyType field indicating the event category and a content object with specific
details. Here are the types you can expect:
1.

ORDER_STATUS
a. Trigger: Sent when an eSIM is created and ready for retrieval.

b. Key content field: orderStatus will be " GOT_RESOURCE ".
c. Example Use: Used to know when your eSIM order is ready for download.
2.

SMDP_EVENT
a. Trigger: Sent during real-time eSIM profile lifecycle events as they occur on the SM-DP+ server.
b. Key content fields:
i.

eid : eUICC identifier of the device.

ii.

iccid : ID of the eSIM.

iii.

esimStatus : Current eSIM state (typically GOT_RESOURCE during provisioning, IN_USE when
active).

iv.

smdpStatus : SM-DP+ server status indicating the specific operation:
a.

DOWNLOAD : eSIM profile is being downloaded to the device.

b.

INSTALLATION : eSIM profile is being installed on the device.

c.

ENABLED : eSIM has been activated/enabled on the device.

d.

DISABLED : eSIM profile has been deactivated/disabled on the device..

e.

DELETED : eSIM profile has been removed from the device.

c. Example Use: Track real-time eSIM provisioning progress and profile state changes for detailed lifecycle
monitoring.
3.

ESIM_STATUS
a. Trigger: Sent when the status of an individual eSIM changes after it has been allocated. This covers
various lifecycle events.
b. Key content fields:
i.

ii.

esimStatus : Indicates the current state. Common values observed include:
a.

IN_USE : The eSIM has been installed/activated on a device.

b.

USED_UP : The eSIM data allowance has been fully consumed.

c.

USED_EXPIRED : The eSIM data is used up, and expired.

d.

UNUSED_EXPIRED : The eSIM expired with data remaining.

e.

CANCEL : The eSIM has been canceled / refunded.

f.

REVOKED : The eSIM profile has been revoked.

smdpStatus : SM-DP+ server status (e.g., ENABLED , DISABLED , RELEASED , DELETED ,
INSTALLATION ).

c. Example Use: Track activation, data exhaustion, expiration, or cancellations for specific eSIMs and notify
customers.
4.

DATA_USAGE
a. Trigger: 3 data usage webhooks will be sent when reaching 50% (0.5) data used, 80%(0.8) data used and
90%(0.9) data used.
b. Key content fields:
i.

totalVolume : Total data allowance in bytes.

ii.

orderUsage : Data used so far in bytes.

iii.

remain : Remaining data in bytes.

iv.

remainThreshold : Values can be: 0.5, 0.2 and 0.1

c. Example Use: Proactively notify end-users about low data balance.
5.

VALIDITY_USAGE
a. Trigger: Sent when the remaining validity period of an active eSIM reaches 1 day.
b. Key content fields:
i.

remain : The remaining validity duration (e.g., 1).

ii.

durationUnit : The unit for the duration (e.g., "DAY").

iii.

expiredTime : The exact timestamp when the eSIM will expire.

iv.

totalDuration : The original validity duration.

c. Example Use: Warn end-users that their plan is about to expire.

IP Whitelist
For additional security, you can whitelist the following sender IPs:
3.1.131.226
54.254.74.88
18.136.190.97
18.136.60.197
18.136.19.137
Note: The content object structure may vary slightly. Always inspect the received payload to understand all
available fields for each notifyType .
Look at our example webhook sending and test trigger form.

json
{
"notifyType": "ORDER_STATUS",
"content": {
"orderNo": "B23072016497499",
"orderStatus": "GOT_RESOURCE"
}
}

json
{
"notifyType": "SMDP_EVENT",
"eventGenerateTime": "2025-09-11T13:28:09+0000",
"notifyId": "5fcc219e32dc484598d3fd700cf3738d",
"content": {
"eid": "89049032007108882600137544319616",
"iccid": "8997250230000292199",
"esimStatus": "GOT_RESOURCE",
"smdpStatus": "DOWNLOAD",
"orderNo": "B25091113270004",
"esimTranNo": "25091113270004",

json
{
"notifyType": "DATA_USAGE",
"eventGenerateTime": "2025-07-21T10:57:28Z",
"notifyId": "f776267e8d6745db8cc316e4c146ea0c",
"content": {
"orderNo": "B25052822150009",
"transactionId": "unique_id_from_partner",
" i
" "2 0 2822 0009"

"esimTranNo": "25052822150009",
"iccid": "8943108170001029631",
"totalVolume": 53687091200,
"orderUsage": 48335585458,
json
{
"notifyType": "VALIDITY_USAGE",
"content": {
"orderNo": "B23072016497499",
"transactionId": "Your_txn_id",
"iccid": "894310817000000003",
"durationUnit": "DAY",
"totalDuration": 30,
"expiredTime": "2024-01-11T08:10:19Z",
"remain": 1
}

json
{
"notifyType": "ESIM_STATUS",
"eventGenerateTime": "2025-08-09T00:23:45Z",
"notifyId": "4038b3dfb1b050bf9f02501df67284f3",
"content": {
"orderNo": "B25080823490018",
"esimTranNo": "25080323490020",
"transactionId": "e23111e4d07746889c7bce41cf3f1b16",
"iccid": "89852000263413436720",
"esimStatus": "CANCEL",
"smdpStatus": "RELEASED"

AUTHORIZATION API Key
This folder is using API Key from collection eSIM Access API

