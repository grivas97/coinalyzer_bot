
import axios from 'axios'; 
import HoneypotCheckerCaller from '../api/HoneypotCheckerCaller.js';
import Web3 from 'web3';
import {
    RPC_BSC,
    PANCAKE_SWAP_ROUTER_ADDRESS,
    WBNB_ADDRESS,
    HONEYPOT_CHECKER_ADDRESS_BSC,
    RPC_MATIC,
    UNISWAP_ROUTER_ADDRESSV3,
    MATIC_ADDRESS,
    HONEYPOT_CHECKER_ADDRESS_MATIC,
    RPC_ETH,
    UNISWAP_ROUTER_ADDRESS,
    WETH_ADDRESS,
    HONEYPOT_CHECKER_ADDRESS_ETH,
  } from "../constants/index.js"
   

const checkforHoneyPot =(abi)=>{

    console.log(abi);
    var str = JSON.stringify(abi).toLowerCase();

    const isAccounting = str.indexOf('accounting')>0;
    const isLibrary = str.indexOf('library')>0;
    const isBlackList = str.indexOf('blacklist')>0;

    console.log(str);
    console.log(isAccounting);
    console.log(isLibrary);
    console.log(isBlackList);

    if(isAccounting ) return true;
    else if(isBlackList) return true;
    else if(isLibrary) return true;

    return false;

  }

  const checkAll = async (tokenAddress)=>{

    const checkAllresult = await getTokenDetails(tokenAddress).then(res=>res);
    return checkAllresult;
  }

  const getTokenDetails = async (tokenAddress) => {
    let tokenInfo ={};

    if(!Web3.utils.isAddress(tokenAddress)){
        tokenInfo={
            status:0,
            mesg:'Not a Valid Address'
        }
         return tokenInfo; 
    } 
    const dexscreener = await axios
      .get(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)
      .then((res) => res)
      .catch((err) => null);

      
      if(dexscreener === null ){
        tokenInfo ={
            status:0,
            mesg:'Token data not updated'
        }
         return tokenInfo;

      }
  
      console.log(dexscreener.data.pairs)
      
    if (dexscreener.data.pairs !=null) {

      const pusd = Number(dexscreener.data.pairs[0].priceUsd);
      const pnat = Number(dexscreener.data.pairs[0].priceNative)

      const quotePrice =2*pusd/pnat;

      let liquidityinQuote = 0;
      let liquiditys = 0;
      if(dexscreener.data.pairs[0]?.liquidity)
      {
        liquidityinQuote=Number(dexscreener.data.pairs[0]?.liquidity?.usd)/quotePrice;
        liquiditys=Number(dexscreener.data.pairs[0]?.liquidity?.usd);
    }
    const liquidity = Number(liquidityinQuote).toFixed(2)+dexscreener.data.pairs[0].quoteToken.symbol+' ($'+liquiditys.toFixed(2)/2+')';

      const chainId = dexscreener.data.pairs[0].chainId;
      const dexId = dexscreener.data.pairs[0].dexId;
      const name = dexscreener.data.pairs[0].baseToken.name;
      const symbol = dexscreener.data.pairs[0].baseToken.symbol;
      const priceUsd = dexscreener.data.pairs[0].priceUsd;
      const pairCreatedAt = dexscreener.data.pairs[0].pairCreatedAt;
      const h1 = dexscreener.data.pairs[0].priceChange.h1;
      const fdv = dexscreener?.data?.pairs[0]?.fdv;
      
      if (chainId === 'bsc') {


 
        const web3 = new Web3(new Web3.providers.HttpProvider(RPC_BSC));
        const honeypotCheckerCaller = new HoneypotCheckerCaller(
          web3,
          HONEYPOT_CHECKER_ADDRESS_BSC
        )

        const {
          buyGas,
          sellGas,
          estimatedBuy,
          exactBuy,
          estimatedSell,
          exactSell,
        } = await honeypotCheckerCaller.check(PANCAKE_SWAP_ROUTER_ADDRESS, [
          WBNB_ADDRESS,
          tokenAddress,
        ]);

 
        const [buyTax, sellTax] = [
          honeypotCheckerCaller.calculateTaxFee(estimatedBuy, exactBuy),
          honeypotCheckerCaller.calculateTaxFee(estimatedSell, exactSell),
        ]; 
         
        console.log(buyGas,
          sellGas,
          estimatedBuy,
          exactBuy,
          estimatedSell,
          exactSell,buyTax+":"+sellTax);

        let verified=false;
        let honeyPotCheck=false;
        const verificationdata = await axios
          .get(`https://api.bscscan.com/api?module=contract&action=getabi&address=${tokenAddress}&apikey=H8S7Y2FBEFSP2I5D1ZSTRR5DM6BDH9Q8SG`)
          .then((response)=>{
            if(response.data.status>0)verified=true;

             let honeyPotCheck = checkforHoneyPot(response.data.result)?'FAILED':'PASSED';
            
 
               tokenInfo= {
                status:1,
              name:name,
              symbol:symbol,
              network:String(chainId).toUpperCase(),
              dexId:String(dexId).toUpperCase(),
              h1:h1,
              buygas:buyGas,
              sellgas:sellGas,
              buyTax:buyTax,
              sellTax:sellTax,
              liquidity:liquidity, 
              priceUsd:Number(priceUsd)+' (in usd )', 
              pairCreatedAt:new Date(pairCreatedAt).toLocaleDateString(),
              isHoneyPot:honeyPotCheck, 
              verified:verified,
              blacklisted:!honeyPotCheck,
              fdv:fdv
            }


          })
          .catch((err) => null);

          

        
      } else 
      if (chainId === 'ethereum') {
        const web3 = new Web3(new Web3.providers.HttpProvider(RPC_ETH)); 
        const honeypotCheckerCaller = new HoneypotCheckerCaller(
          web3,
          HONEYPOT_CHECKER_ADDRESS_ETH
        )

        const {
          buyGas,
          sellGas,
          estimatedBuy,
          exactBuy,
          estimatedSell,
          exactSell,
        } = await honeypotCheckerCaller.check(UNISWAP_ROUTER_ADDRESS, [
          WETH_ADDRESS,
          tokenAddress,
        ]);

        const [buyTax, sellTax] = [
          honeypotCheckerCaller.calculateTaxFee(estimatedBuy, exactBuy),
          honeypotCheckerCaller.calculateTaxFee(estimatedSell, exactSell),
        ]; 
         

        let verified=false;
        let honeyPotCheck=false;
        const verificationdata = await axios
          .get(`https://api.etherscan.io/api?module=contract&action=getabi&address=${tokenAddress}&apikey=CTMK2UQQ1GZZNQ1P6X5ZAX1BPB7YQVEQKS`)
          .then((response)=>{
            if(response.data.status>0)verified=true;

            console.log(response.data);
            let honeyPotCheck = checkforHoneyPot(response.data.result)?'FAILED':'PASSED';
            
            if(buyGas === -1)honeyPotCheck='FAILED';            
            console.log('hpchecl '+ honeyPotCheck);
            tokenInfo={
                status:1,
              name:name,
              symbol:symbol,
              network:String(chainId).toUpperCase(),
              dexId:String(dexId).toUpperCase(),
              h1:h1,
              buygas:buyGas,
              sellgas:sellGas,
              buyTax:buyTax,
              sellTax:sellTax,
              liquidity:liquidity, 
              priceUsd:Number(priceUsd).toFixed(8)+' (in usd )', 
              pairCreatedAt:new Date(pairCreatedAt).toLocaleDateString(),
              isHoneyPot:honeyPotCheck, 
              verified:verified,
              blacklisted:!honeyPotCheck
            }


          })
          .catch((err) => null);

          

        
      } else 
      if (chainId === 'polygon') {
        const web3 = new Web3(new Web3.providers.HttpProvider(RPC_MATIC));  

 
        const honeypotCheckerCaller = new HoneypotCheckerCaller(
          web3,
          HONEYPOT_CHECKER_ADDRESS_MATIC
        )

        const {
          buyGas,
          sellGas,
          estimatedBuy,
          exactBuy,
          estimatedSell,
          exactSell,
        } = await honeypotCheckerCaller.check(UNISWAP_ROUTER_ADDRESSV3, [
          MATIC_ADDRESS,
          tokenAddress,
        ]);

        const [buyTax, sellTax] = [
          honeypotCheckerCaller.calculateTaxFee(estimatedBuy, exactBuy),
          honeypotCheckerCaller.calculateTaxFee(estimatedSell, exactSell),
        ]; 
         

        let verified=false;
        let honeyPotCheck=false;
        const verificationdata = await axios
          .get(`https://api.polygonscan.com/api?module=contract&action=getabi&address=${tokenAddress}&apikey=GHAVAWYIQBVF4I5BAWECNV6TTE1QKXDNAH`)
          .then((response)=>{
            if(response.data.status>0)verified=true;

            console.log(response.data);
            let honeyPotCheck = checkforHoneyPot(response.data.result)?'FAILED':'PASSED';
            
            if(buyGas === -1)honeyPotCheck='FAILED';            
            console.log('hpcheck '+ honeyPotCheck);
            tokenInfo={
                status:1,
              name:name,
              symbol:symbol,
              network:String(chainId).toUpperCase(),
              dexId:String(dexId).toUpperCase(),
              h1:h1,
              buygas:buyGas,
              sellgas:sellGas,
              buyTax:buyTax,
              sellTax:sellTax,
              liquidity:liquidity, 
              priceUsd:Number(priceUsd).toFixed(8)+' (in usd )', 
              pairCreatedAt:new Date(pairCreatedAt).toLocaleDateString(),
              isHoneyPot:honeyPotCheck, 
              verified:verified,
              blacklisted:!honeyPotCheck
            }


          })
          .catch((err) => null); 
      }
    }

    return tokenInfo;

   }


   export default getTokenDetails;