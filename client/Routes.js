import React, {Component, Fragment} from 'react'
import {connect} from 'react-redux'
import {withRouter, Route, Switch, Redirect} from 'react-router-dom'
import { Login, Signup } from './components/AuthForm';
import Home from './components/Home';
import Chat from './components/Chat';
import {me, fetchMessages, fetchOnlineUsers} from './store'

/**
 * COMPONENT
 */
class Routes extends Component {
  componentDidMount() {
    this.props.loadInitialData() 
  }
  componentDidUpdate(prevProps){
    if(!prevProps.auth.id && this.props.auth.id){
      window.socket = io();
      window.socket.on('welcome', msg => console.log(msg));
      window.socket.emit('token', window.localStorage.getItem('token'));
      window.socket.on('userEntered', user => {
        this.props.userEntered(user);
      });
      window.socket.on('userLeft', user => {
        this.props.userLeft(user);
      });
      window.socket.on('message', message => {
        this.props.message(message);
      });
      this.props.fetchMessages();
      this.props.fetchOnlineUsers();
    }
    if(prevProps.auth.id && !this.props.auth.id){
      console.log('here');
      window.socket.close();
    }
  }

  render() {
    const {isLoggedIn} = this.props

    return (
      <div>
        {isLoggedIn ? (
          <div>
            <Switch>
              <Route path="/home" component={Home} />
              <Redirect to="/home" />
            </Switch>
            <Route component={ Chat } />
          </div>
        ) : (
          <Switch>
            <Route path='/' exact component={ Login } />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
          </Switch>
        )}
      </div>
    )
  }
}

/**
 * CONTAINER
 */
const mapState = state => {
  return {
    // Being 'logged in' for our purposes will be defined has having a state.auth that has a truthy id.
    // Otherwise, state.auth will be an empty object, and state.auth.id will be falsey
    isLoggedIn: !!state.auth.id,
    auth: state.auth
  }
}

const mapDispatch = dispatch => {
  return {
    fetchMessages: ()=> {
      dispatch(fetchMessages())
    },
    fetchOnlineUsers: ()=> {
      dispatch(fetchOnlineUsers())
    },
    userEntered: (user)=> {
      dispatch({type: 'USER_ENTERED', user})
    },
    userLeft: (user)=> {
      dispatch({type: 'USER_LEFT', user})
    },
    message: (message)=> {
      console.log(message);
      dispatch({type: 'CREATE_MESSAGE', message})
    },
    loadInitialData() {
      dispatch(me())
    }
  }
}

// The `withRouter` wrapper makes sure that updates are not blocked
// when the url changes
export default withRouter(connect(mapState, mapDispatch)(Routes))
