import { useState, useEffect } from "react";
import { useAddress, useConnectionStatus, ConnectWallet } from "@thirdweb-dev/react";
import { ethers } from "ethers";
import ballnAbi from "../../abi/balln.json";

export default function Home() {
  const address = useAddress();
  const connectionStatus = useConnectionStatus();
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("avax");
  const [loading, setLoading] = useState(false);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const generated = [...Array(65)].map(() => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 10}s`,
    }));
    setSparkles(generated);
  }, []);

  const handleMint = async () => {
    if (!address) return alert("Connect your wallet first.");
    setLoading(true);

    try {
      const { ethereum } = window;
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();

      const deployer = process.env.NEXT_PUBLIC_DEPLOYER_WALLET;

      if (paymentMethod === "avax") {
        const tx = await signer.sendTransaction({
          to: deployer,
          value: ethers.utils.parseEther((0.085 * quantity).toFixed(4))
        });
        await tx.wait();
      }

      if (paymentMethod === "balln") {
        const token = new ethers.Contract(
          process.env.NEXT_PUBLIC_BALLN_TOKEN_ADDRESS,
          ballnAbi,
          signer
        );

        const amount = ethers.utils.parseUnits((6 * quantity).toString(), 18);
        const tx = await token.transfer(deployer, amount);
        await tx.wait();
      }

      const res = await fetch("/api/mint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, quantity, paymentMethod }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.href = `/success?tokenIds=${data.tokenIds.join(",")}`;
      } else {
        alert("Mint failed: " + data.error);
      }

    } catch (err) {
      console.error(err);
      alert("Transaction failed: " + err.message);
    }

    setLoading(false);
  };

  return (
    <main style={{
      backgroundColor: "#000",
      minHeight: "100vh",
      padding: "2rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <div style={{
        backgroundColor: "#111",
        padding: "2rem",
        border: "4px solid #00bfff",
        borderRadius: "15px",
        maxWidth: "600px",
        width: "100%",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
      }}>
        <ConnectWallet />

        <h1 style={{ fontSize: "1.75rem", margin: "1rem 0" }}>🎟️ Mint a Balln Raffle Ticket</h1>
        <div style={{ display: "flex", justifyContent: "center", margin: "1.5rem 0", position: "relative" }}>
          <div style={{
            width: "300px",
            borderRadius: "20px",
            overflow: "hidden",
            position: "relative"
          }}>
            <img
              src="/sample-ticket.png"
              alt="Raffle Ticket"
              style={{
                width: "100%",
                display: "block",
                borderRadius: "20px"
              }}
            />
            <div className="css-sparkles">
              {sparkles.map((s, i) => (
                <div
                  key={i}
                  className="twinkle"
                  style={{
                    top: s.top,
                    left: s.left,
                    animationDelay: s.delay,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        <p style={{ margin: "1rem 0" }}>Each NFT costs <strong>0.085 AVAX</strong> or <strong>6 $balln</strong></p>

        <div style={{ marginBottom: "1rem" }}>
          <label>Quantity: </label>
          <select onChange={(e) => setQuantity(Number(e.target.value))}>
            {[1, 3, 5, 10].map((q) => (
              <option key={q} value={q}>{q}</option>
            ))}
          </select>

          <label style={{ marginLeft: "1rem" }}>Payment:</label>
          <select onChange={(e) => setPaymentMethod(e.target.value)}>
            <option value="avax">AVAX (0.085 each)</option>
            <option value="balln">BALLN (6 per NFT)</option>
          </select>
        </div>

        <button
          onClick={handleMint}
          disabled={loading}
          style={{
            padding: "0.75rem 3rem",
            backgroundColor: "#00bfff",
            color: "#000",
            fontWeight: "bold",
            fontSize: "1.75rem",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer"
          }}
        >
          {loading ? "Minting..." : "Mint Now"}
        </button>

        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          backgroundColor: "#ffe6f0",
          border: "2px solid #ff69b4",
          borderRadius: "10px",
          color: "#000",
          fontWeight: "bold",
        }}>
          🚨 Want to mint for less? <a href="https://t.me/BALLN3" target="_blank" rel="noopener noreferrer" style={{ color: "#ff1493", textDecoration: "underline" }}>Come into our Telegram!</a>
        </div>

        <p style={{ marginTop: "1rem" }}>
          Your wallet: {connectionStatus === "connected" ? address : "Not connected"}
        </p>
      </div>
    </main>
  );
}
