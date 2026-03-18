export const generateSnippet = (
  lang: string,
  method: string,
  url: string,
  authHeader: string,
  body?: any
) => {
  const fullUrl = `https://api.proxysock.com${url}`;
  const jsonBody = body ? JSON.stringify(body, null, 2) : "";

  switch (lang) {
    case "curl":
      return `curl -X ${method} "${fullUrl}" \\\n  -H "Authorization: ${authHeader}"${
        body ? ` \\\n  -d '${jsonBody}'` : ""
      }`;

    case "node":
      return `const axios = require('axios');\n\ntry {\n  const response = await axios({\n    method: '${method.toLowerCase()}',\n    url: '${fullUrl}',\n    headers: {\n      'Authorization': '${authHeader}',\n      'Content-Type': 'application/json'\n    }${
        body ? `,\n    data: ${jsonBody}` : ""
      }\n  });\n  console.log(response.data);\n} catch (error) {\n  console.error(error);\n}`;

    case "python":
      return `import requests\n\nurl = "${fullUrl}"\nheaders = {\n    "Authorization": "${authHeader}",\n    "Content-Type": "application/json"\n}\n\nresponse = requests.${method.toLowerCase()}(\n    url, \n    headers=headers${
        body ? `, \n    json=${jsonBody}` : ""
      }\n)\nprint(response.json())`;

    case "go":
      return `package main\n\nimport (\n\t"bytes"\n\t"encoding/json"\n\t"fmt"\n\t"net/http"\n)\n\nfunc main() {\n\turl := "${fullUrl}"\n\t${
        body
          ? `payload, _ := json.Marshal(${jsonBody})\n\treq, _ := http.NewRequest("${method}", url, bytes.NewBuffer(payload))`
          : `req, _ := http.NewRequest("${method}", url, nil)`
      }\n\n\treq.Header.Set("Authorization", "${authHeader}")\n\treq.Header.Set("Content-Type", "application/json")\n\n\tclient := &http.Client{}\n\tresp, _ := client.Do(req)\n\tdefer resp.Body.Close()\n\n\tfmt.Println("Response Status:", resp.Status)\n}`;

    case "php":
      return `<?php\n\n$ch = curl_init();\n\ncurl_setopt($ch, CURLOPT_URL, "${fullUrl}");\ncurl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);\ncurl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${method}");\ncurl_setopt($ch, CURLOPT_HTTPHEADER, array(\n  "Authorization: ${authHeader}",\n  "Content-Type: application/json"\n));\n${
        body ? `curl_setopt($ch, CURLOPT_POSTFIELDS, '${jsonBody}');\n` : ""
      }\n$response = curl_exec($ch);\ncurl_close($ch);\n\nvar_dump($response);`;

    case "java":
      return `import java.net.URI;\nimport java.net.http.HttpClient;\nimport java.net.http.HttpRequest;\nimport java.net.http.HttpResponse;\n\npublic class Main {\n    public static void main(String[] args) throws Exception {\n        HttpClient client = HttpClient.newHttpClient();\n        HttpRequest request = HttpRequest.newBuilder()\n            .uri(URI.create("${fullUrl}"))\n            .header("Authorization", "${authHeader}")\n            .header("Content-Type", "application/json")\n            .method("${method}", ${
        body
          ? `HttpRequest.BodyPublishers.ofString("${jsonBody.replace(
              /"/g,
              '\\"'
            )}")`
          : "HttpRequest.BodyPublishers.noBody()"
      })\n            .build();\n\n        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());\n        System.out.println(response.body());\n    }\n}`;

    case "csharp":
      return `using System.Net.Http;\nusing System.Text;\nusing System.Threading.Tasks;\n\nclass Program {\n    static async Task Main() {\n        var client = new HttpClient();\n        var request = new HttpRequestMessage(HttpMethod.${
        method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
      }, "${fullUrl}");\n        \n        request.Headers.Add("Authorization", "${authHeader}");\n        ${
        body
          ? `request.Content = new StringContent("${jsonBody.replace(
              /"/g,
              '\\"'
            )}", Encoding.UTF8, "application/json");`
          : ""
      }\n\n        var response = await client.SendAsync(request);\n        var content = await response.Content.ReadAsStringAsync();\n        System.Console.WriteLine(content);\n    }\n}`;

    default:
      return "";
  }
};
