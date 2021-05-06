import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Compound from '@compound-finance/compound-js'// in Node.js
import data from '../apy.js'

const headers = ['Ticker', 'Logo','Price', 'Supply APY', 'Comp APY', 'Total APY']

export default function Home({apys}) {

  
  const formatNumber = number => new Number(number).toFixed(2)
  const formatPercent = number => `${formatNumber(number)}%`

  return (
    <div className = 'container'>
      <Head>
        <title>Compound dashboard</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className='row mt-4'>
        <div className='col-sm-12'>
          <div className="jumbotron bg-dark">
            <h1 className='text-center text-success'>Compound Dashboard</h1>
            <p className="display-5 text-center text-white">Shows Compound APYs <br/> with COMP token rewards</p>
          </div>
        </div>
      </div>
      <table className='table'>
        <thead className ='bg-dark text-success'>
          <tr>
            {headers.map((header,i) => <th key={i}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {apys && apys.map((apy,i) => {
            return (
              <tr key={i}>
                <td>{apy.tickerUnderlying}</td>
                <td><img src={`img/${apy.tickerUnderlying.toLowerCase()}.png`} style = {{width:25, height:25}}/></td>
                <td>{formatNumber(apy.priceUnderlying)}</td>
                <td>{formatPercent(apy.supplyApy)}</td>
                <td>{formatPercent(apy.compApy)}</td>
                <td>{formatPercent(apy.compApy + apy.supplyApy)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <footer className={styles.footer}>
        <a
          href="https://twitter.com/Zed_Blockchain"
          target="_blank"
          rel="noopener noreferrer"
        >
          Site by @Zed_Blockchain! Adopted from EatTheBlocks {' '}
        </a>
      </footer>
    </div>
  )
}

export async function getServerSideProps(context) {
  const apys = await Promise.all([
    data(Compound.cDAI, 'DAI'),
    data(Compound.cETH, 'ETH'),
    data(Compound.cUSDC, 'USDC'),
    data(Compound.cUSDT, 'USDT'),
    data(Compound.cBAT, 'BAT'),
    data(Compound.cUNI, 'UNI'),
    data(Compound.cZRX, 'ZRX'),
    data(Compound.cCOMP, 'COMP')
  ])
  return {
    props: {
      apys
    }
  }
}