import React, { useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import ENS from 'ethereum-ens'
import _ from 'lodash'
import { getEthAddressType, isAddress, ETH_ADDRESS_TYPE } from '../../utils/address.js'
import Loader from '../../components/Loader.js'
import { SingleNameBlockies } from '../../components/SingleName/SingleNameBlockies.js'
import warningImage from '../../assets/warning.svg'
import searchImage from '../../assets/search.svg'

import './style.css'

const ENS_NOT_FOUND = 'ENS name not found'

function Address(props) {
  const [resolvedAddress, setResolvedAddress] = useState(null)
  const [inputValue, setInputValue] = useState('')
  const [isResolvingInProgress, setIsResolvingInProgress] = useState(false)
  const [error, setError] = useState(null)

  const ens = new ENS(props.provider)

  const inputDebouncerHandler = async (address) => {
    try {
      const result = await resolveName(address)
      setError(null)
      setResolvedAddress(result)

      props.onResolve(result)
      props.onError(null)
    } catch(error) {
      setError(error.toString())
      setResolvedAddress(null)

      props.onResolve(null)
      props.onError(error)
    }
  }

  const inputDebouncer = useCallback(_.debounce(inputDebouncerHandler, 300), [])

  const handleInput = async (address) => {
    if (!address) {
      setInputValue('')
      setError(null)
      setResolvedAddress(null)

      return inputDebouncer.cancel()
    }

    setInputValue(address)
    inputDebouncer(address)
  }

  const handleResolver = async (fn) => {
    try {
      setIsResolvingInProgress(true)
      setResolvedAddress(null)
      return await fn()
    } catch(error) {
      if (error && error.message && error.message === ENS_NOT_FOUND) return
      throw error
    } finally {
      setIsResolvingInProgress(false)
    }
  }

  const resolveName = async (address) => {
    const addressType = getEthAddressType(address)

    if (addressType === ETH_ADDRESS_TYPE.name) {
      return await handleResolver(() => ens.resolver(address).addr())
    } else if (addressType === ETH_ADDRESS_TYPE.address) {
      return await handleResolver(() => ens.reverse(address).name())
    }

    throw 'Incorrect address or name'
  }

  const isResolveNameNotFound = () => {
    return (
      !resolvedAddress &&
      inputValue &&
      !isResolvingInProgress &&
      getEthAddressType(inputValue) !== ETH_ADDRESS_TYPE.address
    )
  }

  const showBlockies = () => {
    if (props.showBlockies) {
      let address

      if (isAddress(inputValue)) {
        address = inputValue
      } else if (isAddress(resolvedAddress)) {
        address = resolvedAddress
      }

      if (address) {
        return <SingleNameBlockies
          address={address}
          imageSize={40}
          className="blockies"
        />
      }
    }
  }

  return (
    <div
      className={`cmp-address ${props.className} ${resolvedAddress ? 'resolved' : ''} ${error ? 'error' : ''}`}>
      <div className="input-wrapper">
        <div className="indicator">
          {isResolvingInProgress && <Loader className="loader" />}
          {!isResolvingInProgress && showBlockies()}
          {isResolveNameNotFound() && (<img src={warningImage} className="icon-wrapper error-icon" />)}
          {props.showSearchIcon && !inputValue && (<img src={searchImage} className="icon-wrapper search-icon" />)}
        </div>
        <input
          onChange={e => handleInput(e.currentTarget.value)}
          placeholder={props.placeholder}
          spellCheck={false}
          name="ethereum"
        />
      </div>
      <div className="info-wrapper">
        {resolvedAddress && (<div className="resolved">{resolvedAddress}</div>)}
      </div>
    </div>
  )
}

Address.propTypes = {
  provider: PropTypes.object.isRequired,
  placeholder: PropTypes.string,
  showBlockies: PropTypes.bool,
  showSearchIcon: PropTypes.bool,
  onError: PropTypes.func,
  onResolve: PropTypes.func,
  className: PropTypes.string
}

Address.defaultProps = {
  placeholder: 'Enter Ethereum name or address',
  showBlockies: true,
  showSearchIcon: true,
  className: '',
  onError: function() {
  },
  onResolve: function() {
  }
}

export default Address