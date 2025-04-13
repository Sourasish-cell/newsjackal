import React, { Component } from 'react'
import { ThemeContext } from '../context/ThemeContext'

export class Spinner extends Component {
  static contextType = ThemeContext;
  
  render() {
    const { darkMode } = this.context;
    
    return (
      <div className='text-center my-3'>
        <div className={`spinner-border ${darkMode ? 'text-light' : 'text-dark'}`} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }
}

export default Spinner
