import axios from "axios";

export async function getAuthToken(): Promise<string> {
  const payload = {
   "username": "bradleyfox58",
    "secret": "xskdGFo5FpROEkD8MT6S5ejhDvzrsasGVinrFHo8"
  }

  try {
    const response = await axios.post("https://reseller.myproxyapi.com/api/v1/getToken", payload);
    // console.log(response.data.data.token);
    return response.data.data.token;
  } catch (error) {
    console.error("Error fetching auth token:", error);
    throw error;
  }
}
 