// services/invite.ts
export async function approveAndInvite(userDocId: string) {
  const res = await fetch(
    "https://us-central1-bikeshop-ab2f0.cloudfunctions.net/approveAndInviteUser",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userDocId }),
      // mode: "cors", // opcional
    }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json(); // { uid, link }
}

