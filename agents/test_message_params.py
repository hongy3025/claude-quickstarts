#!/usr/bin/env python3
"""Test suite for Agent message_params functionality.
Agent message_params 功能的测试套件。

This module tests the ability to pass custom parameters to the Claude API
through the Agent's message_params argument, including headers, metadata,
and API parameters.
本模块测试通过 Agent 的 message_params 参数向 Claude API 传递自定义参数的能力，包括请求头 (headers)、元数据 (metadata) 和 API 参数。
"""

import os
import sys
# Add parent directory to path for imports
# 将父目录添加到路径中以便进行导入
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.agent import Agent, ModelConfig


class TestMessageParams:
    """Test cases for message_params functionality.
    message_params 功能的测试用例。
    """
    
    def __init__(self, verbose: bool = True):
        """Initialize test suite.
        初始化测试套件。
        
        Args:
            verbose: Whether to print detailed output
                     是否打印详细输出
        """
        self.verbose = verbose
        self.passed = 0  # 通过的测试数
        self.failed = 0  # 失败的测试数
        
    def _print(self, message: str) -> None:
        """Print message if verbose mode is on.
        如果处于详细模式，则打印消息。
        """
        if self.verbose:
            print(message)
            
    def _run_test(self, test_name: str, test_func: callable) -> None:
        """Run a single test and track results.
        运行单个测试并追踪结果。
        
        Args:
            test_name: Name of the test
                       测试名称
            test_func: Test function to execute
                       要执行的测试函数
        """
        self._print(f"\n{'='*60}")
        self._print(f"Running: {test_name}")
        self._print('='*60)
        
        try:
            test_func()
            self.passed += 1
            self._print(f"✓ {test_name} PASSED")
        except Exception as e:
            self.failed += 1
            self._print(f"✗ {test_name} FAILED: {str(e)}")
            if self.verbose:
                import traceback
                traceback.print_exc()
    
    def test_basic_agent(self) -> None:
        """Test agent without message_params to ensure backward compatibility.
        测试不带 message_params 的 Agent，以确保向后兼容性。
        """
        agent = Agent(
            name="BasicAgent",
            system="You are a helpful assistant. Be very brief.",
            verbose=False
        )
        
        response = agent.run("What is 2+2?")
        # response is a list of message content blocks
        # response 是一个消息内容块列表
        assert any("4" in str(block.get("text", "")) for block in response if block.get("type") == "text")
        response_text = next((block["text"] for block in response if block.get("type") == "text"), "")
        self._print(f"Response: {response_text}")
        
    def test_custom_headers(self) -> None:
        """Test passing custom headers through message_params.
        测试通过 message_params 传递自定义请求头。
        """
        agent = Agent(
            name="HeaderAgent",
            system="You are a helpful assistant. Be very brief.",
            verbose=False,
            message_params={
                "extra_headers": {
                    "X-Custom-Header": "test-value",
                    "X-Request-ID": "test-12345"
                }
            }
        )
        
        # Verify headers are stored
        # 验证请求头已存储
        assert "extra_headers" in agent.message_params
        assert agent.message_params["extra_headers"]["X-Custom-Header"] == "test-value"
        
        response = agent.run("What is 3+3?")
        response_text = next((block["text"] for block in response if block.get("type") == "text"), "")
        assert "6" in response_text
        self._print(f"Response with custom headers: {response_text}")
        
    def test_beta_headers(self) -> None:
        """Test passing beta feature headers.
        测试传递 Beta 功能请求头。
        """
        agent = Agent(
            name="BetaAgent",
            system="You are a helpful assistant. Be very brief.",
            verbose=False,
            message_params={
                "extra_headers": {
                    "anthropic-beta": "files-api-2025-04-14"
                }
            }
        )
        
        # The API call should succeed even with beta headers
        # 即使带有 Beta 请求头，API 调用也应成功
        response = agent.run("What is 5*5?")
        response_text = next((block["text"] for block in response if block.get("type") == "text"), "")
        assert "25" in response_text
        self._print(f"Response with beta headers: {response_text}")
        
    def test_metadata(self) -> None:
        """Test passing valid metadata fields.
        测试传递有效的元数据字段。
        """
        agent = Agent(
            name="MetadataAgent",
            system="You are a helpful assistant. Be very brief.",
            verbose=False,
            message_params={
                "metadata": {
                    "user_id": "test-user-123"
                }
            }
        )
        
        response = agent.run("What is 10/2?")
        response_text = next((block["text"] for block in response if block.get("type") == "text"), "")
        assert "5" in response_text
        self._print(f"Response with metadata: {response_text}")
        
    def test_api_parameters(self) -> None:
        """Test passing various API parameters.
        测试传递各种 API 参数。
        """
        agent = Agent(
            name="ParamsAgent",
            system="You are a helpful assistant.",
            verbose=False,
            message_params={
                "top_k": 10,
                "top_p": 0.95,
                "temperature": 0.7
            }
        )
        
        # Verify parameters are passed through
        # 验证参数已传递
        params = agent._prepare_message_params()
        assert params["top_k"] == 10
        assert params["top_p"] == 0.95
        assert params["temperature"] == 0.7
        
        response = agent.run("Say 'test'")
        response_text = next((block["text"] for block in response if block.get("type") == "text"), "")
        assert response_text
        self._print(f"Response with custom params: {response_text}")
        
    def test_parameter_override(self) -> None:
        """Test that message_params override config defaults.
        测试 message_params 是否覆盖配置默认值。
        """
        config = ModelConfig(
            temperature=1.0,
            max_tokens=100
        )
        
        agent = Agent(
            name="OverrideAgent",
            system="You are a helpful assistant.",
            config=config,
            verbose=False,
            message_params={
                "temperature": 0.5,  # Should override config (应覆盖配置)
                "max_tokens": 200    # Should override config (应覆盖配置)
            }
        )
        
        params = agent._prepare_message_params()
        assert params["temperature"] == 0.5
        assert params["max_tokens"] == 200
        self._print("Parameter override successful")
        
    def test_invalid_metadata_field(self) -> None:
        """Test that invalid metadata fields are properly rejected by the API.
        测试无效的元数据字段是否被 API 正确拒绝。
        """
        agent = Agent(
            name="InvalidAgent",
            system="You are a helpful assistant.",
            verbose=False,
            message_params={
                "metadata": {
                    "user_id": "valid",
                    "invalid_field": "should-fail"
                }
            }
        )
        
        try:
            agent.run("Test")
            # Should not reach here
            # 不应到达此处
            raise AssertionError("Expected API error for invalid metadata field")
        except Exception as e:
            assert "invalid_request_error" in str(e) or "metadata" in str(e).lower()
            self._print(f"Correctly rejected invalid metadata: {type(e).__name__}")
            
    def test_combined_parameters(self) -> None:
        """Test combining multiple parameter types.
        测试组合多种参数类型。
        """
        agent = Agent(
            name="CombinedAgent",
            system="You are a helpful assistant. Be very brief.",
            verbose=False,
            message_params={
                "extra_headers": {
                    "X-Test": "combined",
                    "anthropic-beta": "files-api-2025-04-14"
                },
                "metadata": {
                    "user_id": "combined-test"
                },
                "temperature": 0.8,
                "top_k": 5
            }
        )
        
        params = agent._prepare_message_params()
        assert params["extra_headers"]["X-Test"] == "combined"
        assert params["metadata"]["user_id"] == "combined-test"
        assert params["temperature"] == 0.8
        assert params["top_k"] == 5
        
        response = agent.run("What is 1+1?")
        response_text = next((block["text"] for block in response if block.get("type") == "text"), "")
        assert "2" in response_text
        self._print(f"Response with combined params: {response_text}")
        
    def run_all_tests(self) -> None:
        """Run all test cases.
        运行所有测试用例。
        """
        self._print("\nAgent message_params Test Suite")
        self._print("="*60)
        
        tests = [
            ("Basic Agent (No message_params)", self.test_basic_agent),
            ("Custom Headers", self.test_custom_headers),
            ("Beta Feature Headers", self.test_beta_headers),
            ("Valid Metadata", self.test_metadata),
            ("API Parameters", self.test_api_parameters),
            ("Parameter Override", self.test_parameter_override),
            ("Invalid Metadata Field", self.test_invalid_metadata_field),
            ("Combined Parameters", self.test_combined_parameters),
        ]
        
        for test_name, test_func in tests:
            self._run_test(test_name, test_func)
            
        self._print(f"\n{'='*60}")
        self._print(f"Test Results: {self.passed} passed, {self.failed} failed")
        self._print("="*60)
        
        return self.failed == 0


def main():
    """Run the test suite.
    运行测试套件。
    """
    # Check for API key
    # 检查 API 密钥
    if not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: Please set ANTHROPIC_API_KEY environment variable")
        sys.exit(1)
        
    # Run tests
    # 运行测试
    test_suite = TestMessageParams(verbose=True)
    success = test_suite.run_all_tests()
    
    # Exit with appropriate code
    # 以适当的退出代码退出
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()