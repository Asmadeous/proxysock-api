import { useThemeStore } from "../../store/themeStore";
import mastercardIcon from "../../assets/logos/masterCard.svg";
import visaIcon from "../../assets/logos/visa.svg";
import amexIcon from "../../assets/logos/americanexpress.svg";
import bitcoinIcon from "../../assets/logos/bitcoin.svg";
import ethereumIcon from "../../assets/logos/ethereum.svg";
import usdtIcon from "../../assets/logos/usdt.svg";
import usdcIcon from "../../assets/logos/usdc.svg";
import mastercardIconBlack from "../../assets/logos/mastercard-black.svg";
import visaIconBlack from "../../assets/logos/visa-black.svg";
import amexIconBlack from "../../assets/logos/americanexpress-black.svg";
import bitcoinIconBlack from "../../assets/logos/bitcoin-black.svg";
import ethereumIconBlack from "../../assets/logos/ethereum-black.svg";
import usdtIconBlack from "../../assets/logos/usdt-black.svg";
import usdcIconBlack from "../../assets/logos/usdc-black.svg";

export const SecurePaymentsSection = () => {
  const { dark } = useThemeStore();
  const paymentMethods = [
    { name: "Mastercard", icon: dark ? mastercardIcon : mastercardIconBlack },
    { name: "Visa", icon: dark ? visaIcon : visaIconBlack },
    { name: "American Express", icon: dark ? amexIcon : amexIconBlack },
    { name: "Bitcoin", icon: dark ? bitcoinIcon : bitcoinIconBlack },
    { name: "Ethereum", icon: dark ? ethereumIcon : ethereumIconBlack },
    { name: "Usdt", icon: dark ? usdtIcon : usdtIconBlack },
    { name: "Usdc", icon: dark ? usdcIcon : usdcIconBlack },
  ];

  return (
    <div className="bg-background py-14 border-t border-primary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-manrope-bold font-bold text-foreground text-center mb-10">
          Secure Payment Methods
        </h2>
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 lg:gap-8">
          {paymentMethods.map((method, index) => (
            <div key={index} className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center bg-transparent">
                <img
                  src={method.icon}
                  alt={method.name}
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                />
              </div>
              <span className="text-foreground text-base font-manrope-semibold font-medium">
                {method.name !== "Visa" &&
                  method.name !== "American Express" &&
                  method.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
